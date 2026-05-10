function SignUp() {
  return <div>sign up</div>;
}
function Verify() {
  return <div>verify</div>;
}

const RegisterFlow = () => {
  //   const { step } = useRegisterContext();
  const step = "signup";

  if (step === "signup") return <SignUp />;
  if (step === "verify") return <Verify />;
};
