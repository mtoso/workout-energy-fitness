interface AppleSignInButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const AppleSignInButton = ({
  label,
  onClick,
  disabled = false,
}: AppleSignInButtonProps) => (
  <button
    type="button"
    className="w-full bg-black text-white rounded-xl py-2.5 font-semibold disabled:opacity-50 inline-flex items-center justify-center gap-2"
    onClick={onClick}
    disabled={disabled}
  >
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="w-5 h-5 fill-current"
    >
      <path d="M16.2 12.7c0-2.4 2-3.5 2.1-3.6-1.2-1.8-3-2-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.8-3.3-.8-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.8 1.3 10.4.9 1.3 2 2.7 3.5 2.7 1.4-.1 1.9-.9 3.6-.9s2.1.9 3.6.9c1.5 0 2.4-1.3 3.3-2.6 1-1.4 1.5-2.8 1.5-2.9 0-.1-2.9-1.1-2.9-4.6zM14.5 5.8c.7-.8 1.2-1.9 1.1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.2 1.9-1 3 .9.1 2-.5 2.7-1.4z" />
    </svg>
    <span>{label}</span>
  </button>
);
