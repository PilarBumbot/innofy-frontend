import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Inject landing styles
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.id = "landing-styles";
    document.head.appendChild(link);
    return () => document.getElementById("landing-styles")?.remove();
  }, []);

  const goToApp = () => navigate("/app");

  return (
    <div dangerouslySetInnerHTML={{__html: ""}} />
  );
}
