import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/user/userSlice";
import cardInfoReducer from "../features/cardInfo/cardInfoSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        cardInfo: cardInfoReducer,
    },
});

export default store;
