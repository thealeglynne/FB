'use client';
import '../header/heade.css';
import Login from '../../login/page'


export default function Header({ onLoginClick }) {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-container">
          <img src="https://i.pinimg.com/736x/2e/21/17/2e21174c914bbda7eb287049b124f403.jpg" alt="Logo Lumina" className="logo-img" />
        </div>
        <Login />
      </div>
    </header>
  );
}
