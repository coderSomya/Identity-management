import React from "react";
import WalletConnection from "./WalletConnection.jsx";
import IdentityDapp from "./IdentityDapp.jsx";

const App = () => {
  return (
    <WalletConnection>
      <IdentityDapp />
    </WalletConnection>
  );
};

export default App;
