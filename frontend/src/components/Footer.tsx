import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <p>&copy; 2025 VirtualRPG. Todos os direitos reservados.</p>
      <div className="links-footer">
        <a href="/sobre">Sobre</a> | <a href="/contato">Contato</a>
      </div>
    </footer>
  );
};

export default Footer;