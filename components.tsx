import React, { useState, ReactNode } from 'react';
import { GRADIENT_BG_CLASS, GRADIENT_TEXT_CLASS, StarIcon, ToolsIcon, CheckCircleIcon, ElectricianIcon, PlumberIcon, CodeIcon, SearchIcon } from './constants';
import { Category, Service, Professional, Review, ServicePricingType, UserType } from './types';

// General Purpose Button
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-150 ease-in-out flex items-center justify-center shadow-md hover:shadow-lg active:shadow-sm';
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantStyles = {
    primary: 'bg-brand-secondary text-white hover:bg-green-600 focus:ring-green-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 focus:ring-gray-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent text-current hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-gray-500 shadow-none',
    gradient: `${GRADIENT_BG_CLASS} text-white hover:opacity-90 focus:ring-brand-primaryTo shadow-lg hover:shadow-xl`,
  };

  const loadingSpinner = (
    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${isLoading || disabled ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? loadingSpinner : (
        <>
          {leftIcon && <span className="mr-2">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

// Input Field
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
}
export const Input: React.FC<InputProps> = ({ label, name, error, leftIcon, className, ...props }) => (
  <div className="w-full">
    {label && <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-dark-subtext mb-1">{label}</label>}
    <div className="relative">
      {leftIcon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{leftIcon}</div>}
      <input
        id={name}
        name={name}
        className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-brand-primaryTo focus:border-brand-primaryTo sm:text-sm bg-white dark:bg-dark-surface dark:text-dark-text ${leftIcon ? 'pl-10' : ''} ${className}`}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

// TextArea
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const TextArea: React.FC<TextAreaProps> = ({ label, name, error, className, ...props }) => (
  <div className="w-full">
    {label && <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-dark-subtext mb-1">{label}</label>}
    <textarea
      id={name}
      name={name}
      rows={3}
      className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-brand-primaryTo focus:border-brand-primaryTo sm:text-sm bg-white dark:bg-dark-surface dark:text-dark-text ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

// Select Field
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}
export const Select: React.FC<SelectProps> = ({ label, name, error, options, className, ...props }) => (
  <div className="w-full">
    {label && <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-dark-subtext mb-1">{label}</label>}
    <select
      id={name}
      name={name}
      className={`block w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:ring-brand-primaryTo focus:border-brand-primaryTo sm:text-sm bg-white dark:bg-dark-surface dark:text-dark-text ${className}`}
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);


// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out" onClick={onClose}>
      <div 
        className={`bg-white dark:bg-dark-surface rounded-lg shadow-xl p-6 m-4 w-full ${sizeClasses[size]} transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-slide-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-semibold ${GRADIENT_TEXT_CLASS}`}>{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

// Card Shell Component
export const Card: React.FC<{ children: ReactNode; className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    className={`bg-white dark:bg-dark-surface shadow-lg rounded-xl p-4 md:p-6 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

// Loading Spinner Component
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; message?: string }> = ({ size = 'md', message }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <ToolsIcon className={`animate-spin ${sizeClasses[size]} ${GRADIENT_TEXT_CLASS}`} />
      {message && <p className="mt-3 text-sm text-gray-600 dark:text-dark-subtext">{message}</p>}
    </div>
  );
};

// Category Pill Component
export const CategoryPill: React.FC<{ category: Category; isActive?: boolean; onClick: () => void }> = ({ category, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ease-in-out border-2
                ${isActive 
                  ? `${GRADIENT_BG_CLASS} text-white border-transparent shadow-md` 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:shadow-md hover:border-brand-primaryTo dark:hover:border-brand-primaryFrom'}`}
  >
    {category.icon && React.isValidElement(category.icon) && React.cloneElement(category.icon as React.ReactElement<{ className?: string }>, { className: `w-5 h-5 ${isActive ? 'text-white' : GRADIENT_TEXT_CLASS}` })}
    <span>{category.name}</span>
  </button>
);

// Service Card Component
export const ServiceCard: React.FC<{ service: Service; onSelect: (service: Service) => void; professionalName?: string }> = ({ service, onSelect, professionalName }) => (
  <Card className="flex flex-col justify-between hover:border-brand-primaryTo border-2 border-transparent" onClick={() => onSelect(service)}>
    <div>
      {service.images && service.images[0] && (
        <img src={service.images[0]} alt={service.title} className="w-full h-32 object-cover rounded-lg mb-3" />
      )}
      {!service.images && service.category.icon && React.isValidElement(service.category.icon) && (
         <div className="w-full h-32 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg mb-3">
          {React.cloneElement(service.category.icon as React.ReactElement<{ className?: string }>, { className: `w-16 h-16 ${GRADIENT_TEXT_CLASS}`})}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-dark-text">{service.title}</h3>
      <p className="text-xs text-gray-500 dark:text-dark-subtext mb-2">Categoria: {service.category.name}</p>
      {professionalName && <p className="text-xs text-gray-500 dark:text-dark-subtext mb-2">Profissional: {professionalName}</p>}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{service.description}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {service.tags.slice(0, 3).map(tag => (
          <span key={tag} className="px-2 py-0.5 text-xs bg-brand-primaryFrom bg-opacity-20 text-brand-primaryFrom rounded-full">{tag}</span>
        ))}
      </div>
    </div>
    <div className="mt-auto">
      <div className="flex justify-between items-center">
        <p className={`text-lg font-bold ${GRADIENT_TEXT_CLASS}`}>
          R$ {service.price.toFixed(2)}
          {service.pricingType === ServicePricingType.HOURLY && <span className="text-xs font-normal text-gray-500 dark:text-dark-subtext"> /hora</span>}
        </p>
        <Button variant="gradient" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(service); }}>
          Detalhes
        </Button>
      </div>
    </div>
  </Card>
);

// Professional Card Component
export const ProfessionalCard: React.FC<{ professional: Professional; onSelect: (professional: Professional) => void }> = ({ professional, onSelect }) => (
  <Card className="hover:border-brand-primaryTo border-2 border-transparent" onClick={() => onSelect(professional)}>
    <div className="flex items-start space-x-4">
      <img src={professional.avatarUrl || `https://picsum.photos/seed/${professional.id}/80/80`} alt={professional.name} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-md" />
      <div className="flex-1">
        <h3 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-dark-text">{professional.name}</h3>
        <p className={`text-sm font-medium ${GRADIENT_TEXT_CLASS}`}>{professional.specializations[0] || 'Especialista Local'}</p>
        <p className="text-xs text-gray-500 dark:text-dark-subtext">{professional.location}</p>
        {professional.avgRating && (
          <div className="flex items-center mt-1">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span className="ml-1 text-xs text-gray-600 dark:text-dark-subtext">{professional.avgRating.toFixed(1)} ({professional.reviews.length} avaliações)</span>
          </div>
        )}
      </div>
      {professional.status === 'Available' && (
         <div className="relative flex items-center justify-center" title="Online Agora">
          <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-500 opacity-100 animate-ping"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-600"></span>
        </div>
      )}
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-2">{professional.bio}</p>
    <div className="mt-4 flex justify-end">
      <Button variant="gradient" size="sm" onClick={(e) => { e.stopPropagation(); onSelect(professional); }}>
        Ver Perfil
      </Button>
    </div>
  </Card>
);

// Review Stars Component
export const ReviewStars: React.FC<{ rating: number; size?: 'sm' | 'md' | 'lg', onRatingChange?: (rating: number) => void }> = ({ rating, size = 'md', onRatingChange }) => {
  const starSize = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`${starSize} ${rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'} ${onRatingChange ? 'cursor-pointer' : ''}`}
          filled={rating >= star}
          onClick={onRatingChange ? () => onRatingChange(star) : undefined}
        />
      ))}
    </div>
  );
};


// Review Card Component
export const ReviewCard: React.FC<{ review: Review }> = ({ review }) => (
  <Card className="mb-4">
    <div className="flex items-start space-x-3">
      <img 
        src={review.clientAvatar || `https://picsum.photos/seed/${review.clientId}/40/40`} 
        alt={review.clientName} 
        className="w-10 h-10 rounded-full object-cover"
      />
      <div>
        <h4 className="font-semibold text-gray-800 dark:text-dark-text">{review.clientName}</h4>
        <ReviewStars rating={review.rating} size="sm" />
        <p className="text-xs text-gray-500 dark:text-dark-subtext mt-0.5">{new Date(review.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{review.comment}</p>
    {review.emojis && review.emojis.length > 0 && (
      <div className="mt-2 flex space-x-1">
        {review.emojis.map((emoji, index) => (
          <span key={index} className="text-lg">{emoji}</span>
        ))}
      </div>
    )}
  </Card>
);

// Form for submitting a review
export const ReviewForm: React.FC<{ onSubmit: (rating: number, comment: string, emojis: string[]) => void, serviceName: string }> = ({ onSubmit, serviceName }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const availableEmojis = ['👍', '⭐', '😊', '💯', '👏'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Por favor, selecione uma avaliação em estrelas.");
      return;
    }
    onSubmit(rating, comment, selectedEmojis);
    setRating(0);
    setComment('');
    setSelectedEmojis([]);
  };

  const toggleEmoji = (emoji: string) => {
    setSelectedEmojis(prev => 
      prev.includes(emoji) ? prev.filter(e => e !== emoji) : [...prev, emoji]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium">Avalie o serviço: <span className={GRADIENT_TEXT_CLASS}>{serviceName}</span></h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-subtext mb-1">Sua avaliação:</label>
        <ReviewStars rating={rating} onRatingChange={setRating} size="lg" />
      </div>
      <TextArea
        label="Seu comentário (opcional):"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Descreva sua experiência..."
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-dark-subtext mb-1">Adicione emojis (opcional):</label>
        <div className="flex space-x-2">
          {availableEmojis.map(emoji => (
            <button 
              key={emoji} 
              type="button" 
              onClick={() => toggleEmoji(emoji)}
              className={`p-2 rounded-full text-2xl transition-all ${selectedEmojis.includes(emoji) ? 'bg-brand-primaryTo bg-opacity-30 scale-110' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" variant="gradient" disabled={rating === 0}>
        Enviar Avaliação
      </Button>
    </form>
  );
};

// Confirmation Dialog (simple version of Modal)
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}
export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar"
}) => {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-gray-600 dark:text-dark-subtext mb-6">{message}</p>
      <div className="flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose}>{cancelText}</Button>
        <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button>
      </div>
    </Modal>
  );
};

// Alert Component
interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}
export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const baseClasses = "p-4 rounded-md shadow-md flex items-start";
  const typeClasses = {
    success: "bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200",
    error: "bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200",
    warning: "bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200",
    info: "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200",
  };
  const Icon = type === 'success' ? CheckCircleIcon : 
               type === 'error' ? ToolsIcon : // Replace with XCircleIcon if available
               type === 'warning' ? ToolsIcon : // Replace with ExclamationTriangleIcon
               ToolsIcon; // Replace with InformationCircleIcon

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <div className="flex-grow">{message}</div>
      {onClose && (
        <button onClick={onClose} className="ml-4 -mt-1 -mr-1 p-1 rounded-md hover:bg-opacity-20 hover:bg-current">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
        </button>
      )}
    </div>
  );
};

// User type toggle switch
interface UserTypeToggleProps {
  userType: UserType;
  setUserType: (type: UserType) => void;
}
export const UserTypeToggle: React.FC<UserTypeToggleProps> = ({ userType, setUserType }) => {
  const isClient = userType === UserType.CLIENT;
  return (
    <div className="flex items-center p-1 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner">
      <button
        onClick={() => setUserType(UserType.CLIENT)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out
                    ${isClient ? `${GRADIENT_BG_CLASS} text-white shadow-md` : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
      >
        Cliente
      </button>
      <button
        onClick={() => setUserType(UserType.PROFESSIONAL)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-in-out
                    ${!isClient ? `${GRADIENT_BG_CLASS} text-white shadow-md` : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
      >
        Profissional
      </button>
    </div>
  );
};

// SearchBar component
interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
}
export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Buscar serviços ou profissionais..." }) => {
  const [term, setTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(term);
  };

  return (
    <form onSubmit={handleSearch} className="w-full">
      <Input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        leftIcon={<SearchIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
        className="text-sm md:text-base"
      />
    </form>
  );
};
