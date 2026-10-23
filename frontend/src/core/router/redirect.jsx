import * as Router from "react-router-dom";

export default function Redirect({ to }) {
  const NavigateComp = Router.Navigate;
  if (!NavigateComp) return null;
  return <NavigateComp to={to} replace />;
}
