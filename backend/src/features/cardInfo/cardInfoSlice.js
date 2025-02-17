import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    invoiceType: "二聯式",
    invoiceSendType: "發票載具",
    cardUser: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    phoneReceipt: "",
    companyEmail: "",
    companyTax: "",
    companyName: "",
    donateSelection: "",
};

const cardInfoSlice = createSlice({
    name: "cardInfo",
    initialState,
    reducers: {
        updateCardInfo: (state, action) => {
            return { ...state, ...action.payload };
        },
    },
});

export const { updateCardInfo } = cardInfoSlice.actions;
export default cardInfoSlice.reducer;
