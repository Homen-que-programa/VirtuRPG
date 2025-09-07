import { Link } from "react-router-dom";

const Page404 = () => {
  return (
    <div>
        <h1>Erro 404</h1>
        <Link to={"/"}>Voltar para pagina inicial.</Link>
    </div>
  );
};

export default Page404;