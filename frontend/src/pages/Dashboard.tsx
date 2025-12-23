import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance';
import transfer from "../api/transfer";
import Main from "../components/Main"
import PinModal from '../components/PinModal'
import { toast } from 'react-toastify'

const Dashboard = () => {
  const [amount, setAmount] = useState<string>('');
  const amountInputRef = useRef<HTMLInputElement | null>(null);
  // Recipient search states and refs
  const recipientInputRef = useRef<HTMLInputElement | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{id:number; name:string; email:string}>>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<{id:number; name:string; email:string} | null>(null);
  const searchTimerRef = useRef<number | null>(null);
  // userDetails and setter come from the layout via outlet context
  type LayoutContext = { userDetails: any; setUserDetails: React.Dispatch<React.SetStateAction<any>> }
  const { setUserDetails, userDetails } = useOutletContext<LayoutContext>()

  // Mobile UI state: show compact balance card first, then show full pay form
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [showPayForm, setShowPayForm] = useState<boolean>(true)
  const [transferLoading, setTransferLoading] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [pendingTransfer, setPendingTransfer] = useState<{ receiverEmail: string; amount: number; note?: string } | null>(null);

  // user details are fetched by the layout; nothing to do here

  // Debounced search effect: wait 400ms after last keystroke before calling API
  useEffect(() => {
    // clear any existing timer
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    if (!searchQuery) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    // schedule API call
    searchTimerRef.current = window.setTimeout(() => {
      axiosInstance
        .get('/auth/search', { params: { q: searchQuery } })
        .then((res: any) => {
          const data = Array.isArray(res.data) ? res.data.slice(0, 10) : [];
          setSearchResults(data);
          setSearchError(null);
        })
        .catch((err: any) => {
          console.error('Search error', err);
          setSearchError('Failed to search');
          setSearchResults([]);
        })
        .finally(() => setSearchLoading(false));
    }, 400);

    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [searchQuery]);

  // If a recipient is present in the URL (e.g. from QR scan), try to auto-select that user
  const location = useLocation()
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const recipient = params.get('recipient')
    if (!recipient) return

    let cancelled = false
    const fetchRecipient = async () => {
      setSearchLoading(true)
      try {
        const res = await axiosInstance.get('/auth/search', { params: { q: recipient } })
        const data = Array.isArray(res.data) ? res.data : []
        if (cancelled) return
        const match = data.find((u: any) => u.email === recipient) || data[0]
        if (match) {
          setSelectedUser(match)
          setSearchQuery('')
          setShowResults(false)
        } else {
          // no exact match: prefill input with the recipient string
          setSearchQuery(recipient)
          setShowResults(false)
        }
      } catch (err) {
        // fallback: prefill the input with recipient
        if (!cancelled) {
          setSearchQuery(recipient)
          setShowResults(false)
        }
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    }

    fetchRecipient()
    return () => { cancelled = true }
  }, [location.search])

  // Detect mobile viewport and react to ?openPay=1 query param
  useEffect(() => {
    const setMobileNow = () => setIsMobile(window.innerWidth < 768)
    setMobileNow()
    window.addEventListener('resize', setMobileNow)
    const params = new URLSearchParams(location.search)
    if (params.get('openPay')) setShowPayForm(true)
    return () => window.removeEventListener('resize', setMobileNow)
  }, [])

  

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Allow only first decimal point and digits
    const cleaned = input.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const intPart = parts[0] || '';
    let fracPart = parts[1] || '';
    // Limit fractional part to 2 digits
    if (fracPart.length > 2) fracPart = fracPart.slice(0, 2);

    const formatted = fracPart ? `${intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fracPart}` : intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setAmount(formatted);
  }

  const handleAmountBlur = () => {
    // if user leaves empty, keep empty
    if (!amount) return;
    // ensure two decimals when blurry (optional)
    if (amount.indexOf('.') === -1) {
      setAmount(prev => prev + '.00');
      return;
    }
    const [i, f] = amount.split('.');
    if ((f || '').length === 0) setAmount(`${i}.00`);
    else if ((f || '').length === 1) setAmount(`${i}.${f}0`);
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    const receiverEmail = selectedUser?.email ?? searchQuery;
    if (!receiverEmail) {
      setTransferError('Please provide a recipient email or select a user');
      return;
    }

    const numeric = parseFloat(amount.replace(/,/g, ''));
    if (Number.isNaN(numeric) || numeric <= 0) {
      setTransferError('Please enter a valid amount greater than 0');
      return;
    }

    // open PIN modal and store pending transfer
    setPendingTransfer({ receiverEmail, amount: numeric, note });
    setShowPinModal(true);
  }

  const handleConfirmPin = async (pin: string) => {
    if (!pendingTransfer) return;
    setTransferError(null);
    setShowPinModal(false);
    // capture current pending transfer and recipient name so we can show toast after clearing state
    const currentPending = pendingTransfer;
    const recipientDisplayName = selectedUser?.name ?? currentPending.receiverEmail;
    try {
      setTransferLoading(true);
      const res = await transfer(pendingTransfer.receiverEmail, pendingTransfer.amount, pin, pendingTransfer.note);
      const data = res.data;
      // update local displayed balance if present
      setUserDetails((prev: any) => ({ ...(prev || {}), balance: data.sender_balance }));
      // clear form
      setAmount('');
      setSelectedUser(null);
      setSearchQuery('');
      setNote('');
      setPendingTransfer(null);
      // show success toast using captured name
      toast.success(`₹ ${currentPending.amount} sent to ${recipientDisplayName}`);
    } catch (err: any) {
      console.error('Transfer error', err);
      const msg = err?.response?.data?.detail || err?.message || 'Transfer failed';
      const errMsg = typeof msg === 'string' ? msg : JSON.stringify(msg);
      setTransferError(errMsg);
      // show error toast
      toast.error(errMsg);
    } finally {
      setTransferLoading(false);
    }
  }
  return (
    <>
      {/* When showPayForm is active, show total balance directly */}
      {isMobile && (
        <div className="md:hidden w-full p-6">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow p-6 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">Total Balance</div>
                <div className="text-2xl font-bold">₹ {userDetails?.balance ?? '0.00'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full form - shown on desktop or when mobile pay toggled */}
      {(!isMobile || showPayForm) && (
        <>
          <Main
            amount={amount}
            amountInputRef={amountInputRef}
            recipientInputRef={recipientInputRef}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            searchLoading={searchLoading}
            searchError={searchError}
            showResults={showResults}
            setShowResults={setShowResults}
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
            handleAmountChange={handleAmountChange}
            handleAmountBlur={handleAmountBlur}
            handleSubmit={handleSubmit}
            note={note}
            setNote={setNote}
            transferLoading={transferLoading}
            transferError={transferError}
            setSearchResults={setSearchResults}
            setSearchError={setSearchError}
          />

          <PinModal
            isOpen={showPinModal}
            onClose={() => {
              setShowPinModal(false)
              setPendingTransfer(null)
            }}
            onConfirm={handleConfirmPin}
            loading={transferLoading}
            error={null}
          />
        </>
      )}
    </>
  )
}

export default Dashboard