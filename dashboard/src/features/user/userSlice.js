import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    phone: "",
    license: "",
};

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setPhone: (state, action) => {
            state.phone = action.payload;
        },
        setLicense: (state, action) => {
            state.license = action.payload;
        },
        resetUser: (state) => {
            state.phone = "";
            state.license = "";
        },
    },
});

export const { setPhone, setLicense, resetUser } = userSlice.actions;
export default userSlice.reducer;
