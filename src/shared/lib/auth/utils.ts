import { auth } from "./auth";

export const getSession = async () => {
  return auth();
};
