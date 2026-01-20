import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
    name: 'ui',
    initialState: {
        selectedMovie: null,
    },
    reducers: {
        setSelectedMovie: (state, action) => {
            state.selectedMovie = action.payload;
        },
    },
});

export const { setSelectedMovie } = uiSlice.actions;
export default uiSlice.reducer;
