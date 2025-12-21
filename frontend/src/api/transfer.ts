import axiosInstance from './axiosInstance';

export interface TransferResponse {
  sender_id: number;
  receiver_id: number;
  amount: number;
  sender_balance: number;
  receiver_balance: number;
}

export async function transfer(receiver_email: string, amount: number, pin: string, note?: string) {
  return axiosInstance.post<TransferResponse>('/transfer', {
    receiver_email,
    amount,
    pin,
    note,
  });
}

export default transfer;
