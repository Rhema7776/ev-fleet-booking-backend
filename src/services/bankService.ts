import axios from "axios";
import { ApiError } from "../utils/ApiError";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  },
});

// Paystack's country param expects full names, not ISO codes — map common
// ISO codes to what Paystack accepts.
const COUNTRY_MAP: Record<string, string> = {
  NG: "nigeria",
  GH: "ghana",
  KE: "kenya",
  ZA: "south africa",
};

interface SearchBanksParams {
  countryCode: string;
  searchTerm?: string;
  page?: number;
  perPage?: number;
}

async function searchBanks({
  countryCode,
  searchTerm = "",
  page = 1,
  perPage = 20,
}: SearchBanksParams) {
  const country = COUNTRY_MAP[countryCode.toUpperCase()];

  if (!country) {
    throw ApiError.badRequest(`Unsupported country code: ${countryCode}`);
  }

  let response;

  try {
    response = await paystackClient.get("/bank", {
      params: {
        country,
        perPage: 100, // fetch a large batch, we filter/paginate ourselves below
      },
    });
  } catch (error) {
    const axiosError = error as { response?: { data?: unknown; status?: number }; message: string };
    console.error("Paystack bank list failed:", axiosError.response?.data || axiosError.message);

    throw new ApiError(
      axiosError.response?.status || 500,
      (axiosError.response?.data as { message?: string })?.message || "Failed to fetch banks."
    );
  }

  let banks: Array<{ name: string; code: string }> = response.data?.data || [];

  // Paystack has no search_term param — filter client-side.
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    banks = banks.filter((bank) => bank.name.toLowerCase().includes(term));
  }

  // Manual pagination, since we already have the full filtered list.
  const start = (page - 1) * perPage;
  const paginated = banks.slice(start, start + perPage);

  return {
    data: paginated,
    meta: { total: banks.length, page, perPage },
  };
}

interface ResolveAccountParams {
  accountNumber: string;
  bankCode: string;
}

async function resolveAccountNumber({ accountNumber, bankCode }: ResolveAccountParams) {
  let response;

  try {
    response = await paystackClient.get("/bank/resolve", {
      params: { account_number: accountNumber, bank_code: bankCode },
    });
  } catch (error) {
    const axiosError = error as { response?: { data?: unknown; status?: number }; message: string };
    console.error(
      "Paystack account resolve failed:",
      axiosError.response?.data || axiosError.message
    );

    throw new ApiError(
      axiosError.response?.status || 400,
      (axiosError.response?.data as { message?: string })?.message ||
        "Could not resolve account number."
    );
  }

  const { account_number, account_name, bank_id } = response.data.data;

  return {
    accountNumber: account_number,
    accountName: account_name,
    bankId: bank_id,
  };
}

export default { searchBanks, resolveAccountNumber };
