import { atom } from "recoil";

interface CredentialStateInterface {
  accessToken?: string | undefined;
  idToken?: string | undefined;
  providerId?: string | undefined;
  signInMethod?: string | undefined;
}

export const userState = atom({
  key: "userState",
  default: {
    displayName: "",
    photoURL: "",
    accessToken: "",
    oauthAccessToken: "",
  },
});

export const credentialState = atom<CredentialStateInterface | null>({
  key: "credentialState",
  default: {
    accessToken: undefined,
    idToken: undefined,
    providerId: undefined,
    signInMethod: undefined,
  },
});

export const ec2TokenState = atom({
  key: "ecToken",
  default: "",
});
