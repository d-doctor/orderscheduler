import { atom } from "recoil";

export const userState = atom({
  key: "userState",
  default: {
    displayName: "",
    photoURL: "",
    accessToken: "",
  },
});

export const ec2TokenState = atom({
  key: "ecToken",
  default: "",
});
