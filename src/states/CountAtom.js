import { atom } from "recoil";

function CountAtom(){

}

export const countState = atom({
    key : "countState",
    default : {
        countA : 1,
        countB : 10,
        countC : 100
    }
});