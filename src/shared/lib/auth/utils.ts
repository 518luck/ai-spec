import { auth } from "./auth";

export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    image: string;
  };
}

export const getSession = async () => {
  return auth() as Promise<Session>;
};
