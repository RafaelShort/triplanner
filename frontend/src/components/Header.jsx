import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getFileUrl } from '../utils/getFileUrl'

function Avatar({ name, avatarUrl, size = 'md' }) {
  const src = getFileUrl(avatarUrl)
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover shrink-0 ring-2 ring-white`}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 ring-2 ring-white`}
    >
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  )
}

// ── Ícone hambúrguer animado ───────────────────────────────────
function HamburgerIcon({ open }) {
  return (
    <div className="flex flex-col justify-center items-center w-5 h-5 gap-1.5">
      <span
        className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 origin-center ${
          open ? 'rotate-45 translate-y-2' : ''
        }`}
      />
      <span
        className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${
          open ? 'opacity-0 scale-x-0' : ''
        }`}
      />
      <span
        className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 origin-center ${
          open ? '-rotate-45 -translate-y-2' : ''
        }`}
      />
    </div>
  )
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)
  const mobileMenuRef = useRef(null)

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Fecha tudo ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fecha tudo ao navegar
  useEffect(() => {
    setDropdownOpen(false)
    setMobileOpen(false)
  }, [location.pathname])

  // Bloqueia scroll quando menu mobile está aberto
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function handleLogout() {
    setDropdownOpen(false)
    setMobileOpen(false)
    logout()
    navigate('/login')
  }

  function isActive(path) {
    return location.pathname === path
  }

  const navLinks = [
    { to: '/trips', label: '🗺️ Minhas viagens' },
    { to: '/profile', label: '👤 Meu perfil' },
  ]

  return (
    <>
      <header className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">

    {/* Logo */}
    <Link
      to="/trips"
      className="flex items-center hover:opacity-80 transition-opacity shrink-0"
    >
      <img
        src="/logo.png"
        alt="TriPlanner"
        className="h-20 w-auto object-contain"
      />
    </Link>


          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/trips"
              className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                isActive('/trips')
                  ? 'text-blue-600 bg-blue-50 font-medium'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Minhas viagens
            </Link>

            <div className="w-px h-5 bg-gray-200 mx-2" />

            {/* Avatar + Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Menu do usuário"
              >
                <Avatar name={user?.name} avatarUrl={user?.avatarUrl} />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-sm font-medium text-gray-800 max-w-[120px] truncate">
                    {user?.name}
                  </span>
                  <span className="text-xs text-gray-400 max-w-[120px] truncate">
                    {user?.email}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-fade-in">
                  {/* Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar name={user?.name} avatarUrl={user?.avatarUrl} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        isActive('/profile')
                          ? 'text-blue-600 bg-blue-50 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>👤</span> Meu perfil
                    </Link>
                    <Link
                      to="/trips"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>🗺️</span> Minhas viagens
                    </Link>
                    <Link
                      to="/trips/new"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span>➕</span> Nova viagem
                    </Link>
                  </div>

                  {/* Sair */}
                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <span>🚪</span> Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Botão hambúrguer mobile */}
          <div className="flex items-center gap-3 md:hidden">
            <Avatar name={user?.name} avatarUrl={user?.avatarUrl} size="sm" />
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Abrir menu"
            >
              <HamburgerIcon open={mobileOpen} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Menu Mobile ──────────────────────────────────────── */}
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header do drawer */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} avatarUrl={user?.avatarUrl} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Links do drawer */}
        <nav className="flex flex-col py-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Sair */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-500 text-sm font-medium hover:bg-red-100 transition-colors"
          >
            🚪 Sair da conta
          </button>
        </div>
      </div>
    </>
  )
}
