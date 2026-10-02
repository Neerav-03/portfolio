import photo192 from '../assets/profile-192.webp';
import photo384 from '../assets/profile-384.webp';
import { profile } from '../data/portfolio';
import './avatar.css';

/** The OS "user account" picture: rounded square, thin border, online dot. */
export function Avatar({ size = 52, status = true }: { size?: number; status?: boolean }) {
  return (
    <span className="avatar" style={{ width: size, height: size }}>
      <img
        src={photo192}
        srcSet={`${photo192} 192w, ${photo384} 384w`}
        sizes={`${size}px`}
        width={size}
        height={size}
        alt={`Portrait of ${profile.name}`}
        decoding="async"
      />
      {status && <span className="avatar__status" aria-hidden="true" />}
    </span>
  );
}
