import React from 'react';

interface TypeRushLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const TypeRushLogo: React.FC<TypeRushLogoProps> = ({ size = 'large' }) => {
  return (
    <div className={`typerush-logo-container size-${size}`}>
      <img
        src="./logo.png"
        alt="TypeRush — Think Fast, Type Faster"
        className="home-logo-img"
        loading="eager"
      />
    </div>
  );
};