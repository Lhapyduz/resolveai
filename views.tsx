

import React, { useState, useEffect, useCallback } from 'react';
import { Page, UserType, Category, Service, Professional, Review, Contract, AppNotification, ContractStatus, ServicePricingType, UserProfile } from './types';
import { Button, Input, TextArea, Select, Modal, Card, LoadingSpinner, CategoryPill, ServiceCard, ProfessionalCard, ReviewCard, ReviewForm, SearchBar, Alert, ReviewStars } from './components';
import { ToolsIcon, GRADIENT_TEXT_CLASS, GRADIENT_BG_CLASS, PlusCircleIcon, EditIcon, TrashIcon, CalendarIcon, BellIcon, StarIcon, CheckCircleIcon, ElectricianIcon, PlumberIcon, CodeIcon } from './constants';
import { generateServiceDescription } from './geminiService';
import { supabase } from './supabaseClient'; // Import Supabase client

interface PageProps {
  setCurrentPage: (page: Page, params?: Record<string, any>) => void;
  currentUser: UserProfile | Professional;
  params?: Record<string, any>;
}

// Helper to get category icon components (client-side mapping)
// In a real app, category data (including icon identifiers) would come from Supabase
const MOCK_CATEGORIES_FOR_ICONS: Category[] = [
  { id: 'cat1', name: 'Eletricistas', icon_name: 'ElectricianIcon' },
  { id: 'cat2', name: 'Encanadores', icon_name: 'PlumberIcon' },
  { id: 'cat3', name: 'Tecnologia (TI)', icon_name: 'CodeIcon' },
  { id: 'cat4', name: 'Limpeza', icon_name: 'ToolsIcon' },
  { id: 'cat5', name: 'Aulas Particulares', icon_name: 'UserIcon' },
];

const getCategoryIconComponent = (iconName?: string): React.ReactNode => {
  switch (iconName) {
    case 'ElectricianIcon': return <ElectricianIcon />;
    case 'PlumberIcon': return <PlumberIcon />;
    case 'CodeIcon': return <CodeIcon />;
    default: return <ToolsIcon />;
  }
};


export const OnboardingPage: React.FC<Omit<PageProps, 'currentUser' | 'params'>> = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between Sign In and Sign Up

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Cliente Supabase não inicializado.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        // Sign Up
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        // After sign up, user is authenticated but profile needs to be created.
        // Redirect to profile edit page with new user flag.
        // Supabase sends a confirmation email by default. For this demo, we'll assume auto-confirmation or manual.
        alert("Cadastro realizado! Verifique seu e-mail para confirmação (se habilitado). Você será redirecionado para completar seu perfil.");
        // The onAuthStateChange in App.tsx should pick up the new user session.
        // We might need to pass session info to ProfileEditPage if profile creation is immediate.
        // For simplicity, let App.tsx handle redirect based on profile existence.
      } else {
        // Sign In
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        // onAuthStateChange in App.tsx will handle redirecting to the correct dashboard
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-brand-primaryFrom via-purple-500 to-brand-primaryTo">
      <Card className="max-w-md w-full animate-slide-in !p-6 md:!p-8">
        <ToolsIcon className={`w-20 h-20 mx-auto mb-6 ${GRADIENT_TEXT_CLASS} animate-subtle-bob`} />
        <h1 className={`text-3xl font-bold mb-2 ${GRADIENT_TEXT_CLASS}`}>{isSignUp ? "Criar Conta" : "Login"} no ResolveAí!</h1>
        <p className="text-md text-gray-700 dark:text-dark-subtext mb-6">
          {isSignUp ? "Junte-se à nossa comunidade de clientes e profissionais." : "Acesse sua conta para continuar."}
        </p>
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        
        <form onSubmit={handleAuth} className="space-y-4 my-4">
          <Input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required label="Email" />
          <Input type="password" placeholder="********" value={password} onChange={e => setPassword(e.target.value)} required label="Senha"/>
          <Button type="submit" variant="gradient" size="lg" className="w-full" isLoading={loading} disabled={loading}>
            {loading ? (isSignUp ? "Cadastrando..." : "Entrando...") : (isSignUp ? "Cadastrar" : "Entrar")}
          </Button>
        </form>

        <p className="text-sm text-gray-600 dark:text-dark-subtext mt-6">
          {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}
          <button onClick={() => { setIsSignUp(!isSignUp); setError(null);}} className={`${GRADIENT_TEXT_CLASS} font-semibold hover:underline ml-1`}>
            {isSignUp ? "Faça Login" : "Cadastre-se aqui"}
          </button>
        </p>
         <p className="text-xs text-gray-500 dark:text-dark-subtext mt-4">
            (Para fins de demonstração, o fluxo de "completar perfil" após o cadastro é simplificado.)
        </p>
      </Card>
    </div>
  );
};

export const ClientHomePage: React.FC<PageProps> = ({ setCurrentPage, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProfs, setLoadingProfs] = useState(true);
  const [loadingCats, setLoadingCats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!supabase) return;
      setLoadingCats(true);
      const { data, error: catError } = await supabase.from('categories').select('*');
      if (catError) {
        console.error("Error fetching categories:", catError);
        setError("Não foi possível carregar as categorias.");
      } else {
        setCategories(data as Category[]);
      }
      setLoadingCats(false);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProfessionals = async () => {
      if (!supabase) return;
      setLoadingProfs(true);
      setError(null);
      let query = supabase
        .from('profiles')
        .select(`
          *,
          services (id, title, description, categoryId, price, pricingType, tags, categories (id, name, icon_name))
        `)
        .eq('userType', UserType.PROFESSIONAL)
        .limit(20); // Add pagination later

      if (searchTerm) {
        // This is a simple text search. For better results, use Supabase full-text search or specific column matching.
        query = query.or(`name.ilike.%${searchTerm}%,specializations.cs.{${searchTerm}}`); 
      }
      // Filtering by category on the client side for simplicity, as it involves services sub-table.
      // A more performant way would be a DB function or more complex query.

      const { data, error: profError } = await query;

      if (profError) {
        console.error("Error fetching professionals:", profError);
        setError("Não foi possível carregar os profissionais.");
        setProfessionals([]);
      } else {
        let filteredData = data as Professional[];
        if (selectedCategory) {
            filteredData = filteredData.filter(prof => 
                prof.services?.some(s => s.categoryId === selectedCategory.id)
            );
        }
        setProfessionals(filteredData);
      }
      setLoadingProfs(false);
    };
    fetchProfessionals();
  }, [searchTerm, selectedCategory]);


  // Placeholder for popular services, ideally fetched with specific criteria
  const popularServices = professionals.flatMap(p => p.services || []).slice(0, 5);

  if (loadingCats && loadingProfs) return <LoadingSpinner message="Carregando ResolveAí..." />;

  return (
    <div className="container mx-auto p-4 space-y-8">
      <header className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-dark-text">Olá, {currentUser.name.split(' ')[0]}!</h1>
        <p className={`text-lg ${GRADIENT_TEXT_CLASS}`}>O que você precisa hoje?</p>
      </header>

      <SearchBar onSearch={setSearchTerm} placeholder="Buscar eletricista, encanador..." />
      {error && <Alert type="error" message={error} onClose={() => setError(null)}/>}

      <div>
        <h2 className="text-xl font-semibold mb-3 text-gray-700 dark:text-dark-subtext">Categorias Populares</h2>
        {loadingCats ? <LoadingSpinner size="sm" /> : (
            <div className="flex space-x-3 overflow-x-auto pb-3 -mx-4 px-4">
            {categories.map(cat => (
                <CategoryPill 
                key={cat.id} 
                category={{...cat, icon: getCategoryIconComponent(cat.icon_name)}}
                isActive={selectedCategory?.id === cat.id}
                onClick={() => setSelectedCategory(prev => prev?.id === cat.id ? null : cat)}
                />
            ))}
            {selectedCategory && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="ml-2">Limpar</Button>
            )}
            </div>
        )}
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-3 text-gray-700 dark:text-dark-subtext">Profissionais {selectedCategory ? `em ${selectedCategory.name}` : ''}</h2>
        {loadingProfs ? <LoadingSpinner /> : professionals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {professionals.map(prof => (
              <ProfessionalCard 
                key={prof.id} 
                professional={prof} 
                onSelect={() => setCurrentPage(Page.PROFESSIONAL_PROFILE_VIEW, { professionalId: prof.id })} 
              />
            ))}
          </div>
        ) : (
         <div className="text-center py-10">
            <ToolsIcon className={`w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600`} />
            <p className="text-gray-600 dark:text-dark-subtext">Nenhum profissional encontrado para "{searchTerm}" {selectedCategory ? `em ${selectedCategory.name}` : ''}.</p>
            <p className="text-sm text-gray-500 dark:text-dark-subtext">Tente refinar sua busca ou explorar outras categorias.</p>
        </div>
        )}
      </div>

      {/* Popular Services section can be improved to fetch actual popular services */}
      {popularServices.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-700 dark:text-dark-subtext">Serviços Populares (Exemplo)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {popularServices.map(service => (
              <ServiceCard 
                key={service.id} 
                service={{...service, category: {...categories.find(c=>c.id === service.categoryId)!, icon: getCategoryIconComponent(categories.find(c=>c.id === service.categoryId)?.icon_name)}}}
                onSelect={(s) => setCurrentPage(Page.SERVICE_DETAIL, { serviceId: s.id, professionalId: s.professionalId })}
                professionalName={professionals.find(p=>p.id === service.professionalId)?.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


export const ProfessionalProfileViewPage: React.FC<PageProps> = ({ setCurrentPage, params, currentUser }) => {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);


  useEffect(() => {
    const fetchCategories = async () => {
        if (!supabase) return;
        const { data, error: catError } = await supabase.from('categories').select('*');
        if (catError) console.error("Error fetching categories for profile view:", catError);
        else setCategories(data as Category[]);
    };
    fetchCategories();
  }, []);


  useEffect(() => {
    const fetchProfessionalDetails = async () => {
      if (!supabase || !params?.professionalId) {
        setError("ID do profissional não fornecido.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      
      // Fetch professional profile
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.professionalId)
        .eq('userType', UserType.PROFESSIONAL)
        .single();

      if (profError || !profData) {
        console.error("Error fetching professional profile:", profError);
        setError("Profissional não encontrado.");
        setLoading(false);
        return;
      }

      // Fetch services for this professional
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select(`*, categories (id, name, icon_name)`) // Join with categories
        .eq('professionalId', params.professionalId);
      
      if (servicesError) console.error("Error fetching services:", servicesError);

      // Fetch reviews for this professional
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('professionalId', params.professionalId)
        .order('createdAt', { ascending: false });

      if (reviewsError) console.error("Error fetching reviews:", reviewsError);
      
      const completeProfessionalProfile: Professional = {
        ...(profData as Professional),
        services: servicesData?.map(s => ({...s, category: s.categories as Category})) || [],
        reviews: reviewsData || [],
        // avgRating could be calculated here or fetched if stored in DB
      };
      // Calculate avgRating locally if not stored
      if (reviewsData && reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((acc, review) => acc + review.rating, 0);
        completeProfessionalProfile.avgRating = totalRating / reviewsData.length;
      }


      setProfessional(completeProfessionalProfile);
      setLoading(false);
    };

    fetchProfessionalDetails();
  }, [params?.professionalId]);

  const handleReviewSubmit = async (rating: number, comment: string, emojis: string[]) => {
    if (!supabase || !professional || !currentUser) {
      alert("Não é possível enviar avaliação. Usuário ou profissional não definido.");
      return;
    }
    
    // For simplicity, assume client is currentUser and is a client type.
    // A service ID might be needed here, choosing the first service for demo.
    const serviceToReview = professional.services?.[0];
    if (!serviceToReview) {
        alert("Este profissional não tem serviços para avaliar, ou selecione um serviço específico.");
        return;
    }

    const newReviewData = {
      clientId: currentUser.id, // Assuming currentUser is the client
      clientName: currentUser.name, // Denormalize for display
      clientAvatar: currentUser.avatarUrl, // Denormalize
      professionalId: professional.id,
      serviceId: serviceToReview.id, 
      rating,
      comment,
      emojis,
      createdAt: new Date().toISOString(),
    };

    const { data: insertedReview, error: insertError } = await supabase
      .from('reviews')
      .insert(newReviewData)
      .select()
      .single();

    if (insertError) {
      console.error("Error submitting review:", insertError);
      alert(`Erro ao enviar avaliação: ${insertError.message}`);
    } else if (insertedReview) {
      setProfessional(prev => prev ? {
          ...prev, 
          reviews: [insertedReview as Review, ...(prev.reviews || [])]
          // Optionally recalculate avgRating here
      } : null);
      setShowReviewModal(false);
      alert("Avaliação enviada com sucesso!");
    }
  };
  
  if (loading) return <LoadingSpinner message="Carregando perfil do profissional..." />;
  if (error) return <Alert type="error" message={error} onClose={() => setCurrentPage(Page.CLIENT_HOME)} />;
  if (!professional) return <div className="text-center p-10">Profissional não encontrado.</div>;
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="!p-0 overflow-hidden">
        <div className={`${GRADIENT_BG_CLASS} h-32 md:h-48`}></div>
        <div className="p-6 relative">
          <img 
            src={professional.avatarUrl || `https://picsum.photos/seed/${professional.id}/120/120`} 
            alt={professional.name} 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white dark:border-dark-surface shadow-lg absolute -top-12 md:-top-16 left-1/2 transform -translate-x-1/2 md:left-6 md:transform-none"
          />
          <div className="md:ml-40 mt-16 md:mt-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-dark-text">{professional.name}</h1>
            <p className={`text-lg font-medium ${GRADIENT_TEXT_CLASS}`}>{professional.specializations?.join(', ')}</p>
            <p className="text-sm text-gray-500 dark:text-dark-subtext">{professional.location}</p>
            {professional.avgRating && (
              <div className="flex items-center mt-1">
                <ReviewStars rating={professional.avgRating} />
                <span className="ml-2 text-sm text-gray-600 dark:text-dark-subtext">({professional.reviews?.length || 0} avaliações)</span>
              </div>
            )}
            <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button 
                variant="gradient" 
                onClick={() => professional.services?.[0] && setCurrentPage(Page.CONTRACT_FLOW, { serviceId: professional.services[0].id, professionalId: professional.id })}
                disabled={!professional.services || professional.services.length === 0}
              >
                Contratar Agora
              </Button>
              {currentUser.userType === UserType.CLIENT && (
                <Button variant="secondary" onClick={() => setShowReviewModal(true)}>Deixar Avaliação</Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-dark-subtext">Sobre</h2>
        <p className="text-gray-600 dark:text-gray-300">{professional.bio}</p>
      </Card>
      
      {professional.services && professional.services.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold mb-3 text-gray-700 dark:text-dark-subtext">Serviços Oferecidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {professional.services.map(service => (
              <ServiceCard 
                key={service.id} 
                service={{...service, category: {...service.category!, icon: getCategoryIconComponent(service.category?.icon_name)}}}
                onSelect={(s) => setCurrentPage(Page.CONTRACT_FLOW, { serviceId: s.id, professionalId: professional.id })}
              />
            ))}
          </div>
        </Card>
      )}

      {professional.portfolio && professional.portfolio.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold mb-3 text-gray-700 dark:text-dark-subtext">Portfólio</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {professional.portfolio.map((item, index) => (
              <div key={index} className="rounded-lg overflow-hidden shadow-md group">
                <img src={item.imageUrl} alt={item.title} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="p-3 bg-white dark:bg-dark-surface">
                  <h3 className="font-medium text-gray-800 dark:text-dark-text">{item.title}</h3>
                  {item.description && <p className="text-xs text-gray-500 dark:text-dark-subtext">{item.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {professional.reviews && professional.reviews.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold mb-3 text-gray-700 dark:text-dark-subtext">Avaliações de Clientes</h2>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {professional.reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </Card>
      )}
       <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title={`Avaliar ${professional.name}`}>
          <ReviewForm onSubmit={handleReviewSubmit} serviceName={`Serviços de ${professional.name}`} />
        </Modal>
    </div>
  );
};

export const ProfessionalDashboardPage: React.FC<PageProps> = ({ setCurrentPage, currentUser }) => {
  const professional = currentUser as Professional;
  const [services, setServices] = useState<Service[]>([]);
  const [status, setStatus] = useState<Professional['status']>(professional.status || 'Available');
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [upcomingContracts, setUpcomingContracts] = useState<Contract[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [newServiceForm, setNewServiceForm] = useState<Partial<Omit<Service, 'id' | 'professionalId' | 'category'> & { categoryId?: string }>>({
    title: '', description: '', categoryId: undefined, price: 0, pricingType: ServicePricingType.FIXED, tags: []
  });
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState<string|null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase || !professional?.id) {
         setLoading(false);
         return;
      }
      setLoading(true);

      const [servicesRes, notificationsRes, contractsRes, categoriesRes] = await Promise.all([
        supabase.from('services').select('*, categories(id, name, icon_name)').eq('professionalId', professional.id),
        supabase.from('notifications').select('*').eq('userId', professional.id).order('createdAt', { ascending: false }).limit(10),
        supabase.from('contracts').select('*').eq('professionalId', professional.id).in('status', [ContractStatus.REQUESTED, ContractStatus.ACCEPTED]).limit(10),
        supabase.from('categories').select('*')
      ]);

      if (servicesRes.error) console.error("Error fetching services:", servicesRes.error);
      else setServices(servicesRes.data?.map(s => ({...s, category: s.categories as Category})) || []);
      
      if (notificationsRes.error) console.error("Error fetching notifications:", notificationsRes.error);
      else setNotifications(notificationsRes.data || []);

      if (contractsRes.error) console.error("Error fetching contracts:", contractsRes.error);
      else setUpcomingContracts(contractsRes.data || []);

      if (categoriesRes.error) console.error("Error fetching categories:", categoriesRes.error);
      else setCategories(categoriesRes.data as Category[]);

      setStatus(professional.status || 'Available');
      setLoading(false);
    };
    fetchData();
  }, [professional?.id, professional?.status]);

  const handleAddOrUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!supabase) return;
    if (!newServiceForm.title || !newServiceForm.categoryId || newServiceForm.price == null) {
      setFormError("Título, categoria e preço são obrigatórios.");
      return;
    }
    
    const serviceData = {
      professionalId: professional.id,
      title: newServiceForm.title!,
      description: newServiceForm.description!,
      categoryId: newServiceForm.categoryId!,
      price: newServiceForm.price!,
      pricingType: newServiceForm.pricingType!,
      tags: newServiceForm.tags!,
      images: newServiceForm.images || [],
      durationEstimate: newServiceForm.durationEstimate
    };

    if (editingService) {
      const { data, error } = await supabase.from('services').update(serviceData).eq('id', editingService.id).select('*, categories(id, name, icon_name)').single();
      if (error) {
        console.error("Error updating service:", error);
        setFormError(error.message);
      } else if (data) {
        setServices(prev => prev.map(s => s.id === editingService.id ? {...data, category: data.categories as Category} : s));
        setShowAddServiceModal(false);
      }
    } else {
      const { data, error } = await supabase.from('services').insert(serviceData).select('*, categories(id, name, icon_name)').single();
      if (error) {
        console.error("Error adding service:", error);
        setFormError(error.message);
      } else if (data) {
        setServices(prev => [{...data, category: data.categories as Category}, ...prev]);
        setShowAddServiceModal(false);
      }
    }
    if(!formError){
        setEditingService(null);
        setNewServiceForm({ title: '', description: '', categoryId: categories[0]?.id, price: 0, pricingType: ServicePricingType.FIXED, tags: [] });
    }
  };

  const handleGenerateDescription = async () => {
    if (!newServiceForm.title || !newServiceForm.tags || newServiceForm.tags.length === 0) {
      setFormError("Por favor, forneça um título e algumas tags para o serviço antes de gerar a descrição.");
      return;
    }
    setIsGeneratingDesc(true);
    setFormError(null);
    try {
      const desc = await generateServiceDescription(newServiceForm.title, newServiceForm.tags, newServiceForm.description);
      setNewServiceForm(prev => ({ ...prev, description: desc }));
    } catch (error: any) {
      console.error("Failed to generate description:", error);
      setFormError("Falha ao gerar descrição: " + error.message);
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setNewServiceForm({ ...service, categoryId: service.categoryId, tags: service.tags || [] });
    setShowAddServiceModal(true);
    setFormError(null);
  };
  
  const deleteService = async (serviceId: string) => {
    if (!supabase) return;
    if(window.confirm("Tem certeza que deseja excluir este serviço?")) {
      const { error } = await supabase.from('services').delete().eq('id', serviceId);
      if (error) {
        console.error("Error deleting service:", error);
        alert("Erro ao excluir serviço: " + error.message);
      } else {
        setServices(prev => prev.filter(s => s.id !== serviceId));
      }
    }
  };
  
  const handleStatusChange = async (newStatus: Professional['status']) => {
      if(!supabase || !professional?.id) return;
      setStatus(newStatus);
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', professional.id);
      if(error) {
          console.error("Error updating status:", error);
          alert("Erro ao atualizar status.");
          // Revert status change if API call fails
          setStatus(professional.status || 'Available');
      }
  }

  const professionalStatusOptions: { value: Professional['status']; label: string }[] = [
    { value: 'Available', label: 'Disponível' },
    { value: 'Busy', label: 'Ocupado' },
    { value: 'Away', label: 'Ausente' },
  ];

  if (loading) return <LoadingSpinner message="Carregando painel..." />;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-dark-text">Painel do Profissional</h1>
          <p className={`${GRADIENT_TEXT_CLASS} text-lg`}>Gerencie seus serviços e agendamentos.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Select 
            options={professionalStatusOptions} 
            value={status} 
            onChange={(e) => handleStatusChange(e.target.value as Professional['status'])}
            className="w-full sm:w-auto"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-dark-subtext">Próximos Contratos</h2>
            <CalendarIcon className="w-6 h-6 text-brand-primaryTo" />
          </div>
          {upcomingContracts.length > 0 ? (
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {upcomingContracts.map(contract => (
                <li key={contract.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm hover:shadow-md transition-shadow">
                  <p className="font-medium text-gray-800 dark:text-dark-text">{contract.serviceTitle || "Serviço não especificado"}</p>
                  <p className="text-sm text-gray-600 dark:text-dark-subtext">Cliente ID: {contract.clientId}</p>
                  <p className="text-sm">Status: <span className={`font-semibold ${contract.status === ContractStatus.REQUESTED ? 'text-yellow-500' : 'text-green-500'}`}>{contract.status}</span></p>
                  <Button size="sm" variant="ghost" className="mt-1 text-xs" onClick={() => setCurrentPage(Page.CONTRACT_FLOW, { contractId: contract.id })}>Ver Detalhes</Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-dark-subtext">Nenhum contrato futuro no momento.</p>
          )}
        </Card>

        <Card>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-dark-subtext">Notificações</h2>
            <BellIcon className="w-6 h-6 text-brand-primaryFrom" />
          </div>
          {notifications.length > 0 ? (
            <ul className="space-y-3 max-h-60 overflow-y-auto">
              {notifications.filter(n => !n.isRead).map(notif => (
                <li key={notif.id} className="p-3 bg-blue-50 dark:bg-blue-900 rounded-md shadow-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-200">{notif.title}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">{notif.message}</p>
                  <p className="text-xs text-gray-500 dark:text-dark-subtext mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                </li>
              ))}
               {notifications.filter(n => n.isRead).map(notif => ( 
                <li key={notif.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md shadow-sm opacity-70">
                  <p className="font-medium text-gray-800 dark:text-dark-text">{notif.title}</p>
                  <p className="text-sm text-gray-600 dark:text-dark-subtext">{notif.message}</p>
                   <p className="text-xs text-gray-500 dark:text-dark-subtext mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-dark-subtext">Nenhuma notificação nova.</p>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-dark-subtext">Meus Serviços</h2>
          <Button variant="gradient" onClick={() => { setEditingService(null); setNewServiceForm({ title: '', description: '', categoryId: categories[0]?.id, price: 0, pricingType: ServicePricingType.FIXED, tags: [] }); setShowAddServiceModal(true); setFormError(null);}} leftIcon={<PlusCircleIcon />}>
            Adicionar Serviço
          </Button>
        </div>
        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(service => (
              <Card key={service.id} className="relative group !p-0 overflow-hidden">
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-1 text-gray-800 dark:text-dark-text truncate" title={service.title}>{service.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-dark-subtext mb-2">Categoria: {service.category?.name || "N/A"}</p>
                  <p className={`text-lg font-bold ${GRADIENT_TEXT_CLASS}`}>
                    R$ {service.price.toFixed(2)}
                    {service.pricingType === ServicePricingType.HOURLY && <span className="text-xs font-normal text-gray-500 dark:text-dark-subtext"> /hora</span>}
                  </p>
                </div>
                <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="ghost" className="!p-1.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => openEditModal(service)} title="Editar"><EditIcon className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="!p-1.5 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => deleteService(service.id)} title="Excluir"><TrashIcon className="w-4 h-4 text-red-500" /></Button>
                </div>
                 <div className={`${GRADIENT_BG_CLASS} h-1 group-hover:h-1.5 transition-all duration-200`}></div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-dark-subtext text-center py-6">Você ainda não cadastrou nenhum serviço.</p>
        )}
      </Card>

      <Modal isOpen={showAddServiceModal} onClose={() => setShowAddServiceModal(false)} title={editingService ? "Editar Serviço" : "Adicionar Novo Serviço"}>
        <form onSubmit={handleAddOrUpdateService} className="space-y-4">
          {formError && <Alert type="error" message={formError} onClose={() => setFormError(null)} />}
          <Input 
            label="Título do Serviço" 
            value={newServiceForm.title} 
            onChange={e => setNewServiceForm(prev => ({...prev, title: e.target.value}))} 
            required 
          />
          <TextArea 
            label="Descrição" 
            value={newServiceForm.description} 
            onChange={e => setNewServiceForm(prev => ({...prev, description: e.target.value}))} 
            rows={4}
          />
          <Input
            label="Tags (separadas por vírgula)"
            value={Array.isArray(newServiceForm.tags) ? newServiceForm.tags.join(', ') : ''}
            onChange={e => setNewServiceForm(prev => ({...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)}))}
            placeholder="ex: rápido, eficiente, 24h"
          />
           <Button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDesc || !newServiceForm.title || !newServiceForm.tags || newServiceForm.tags.length === 0} isLoading={isGeneratingDesc}>
            {isGeneratingDesc ? "Gerando..." : "Gerar Descrição com IA"}
          </Button>

          <Select 
            label="Categoria"
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            value={newServiceForm.categoryId}
            onChange={e => setNewServiceForm(prev => ({...prev, categoryId: e.target.value}))}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Preço (R$)" 
              type="number"
              step="0.01"
              value={newServiceForm.price} 
              onChange={e => setNewServiceForm(prev => ({...prev, price: parseFloat(e.target.value) || 0}))} 
              required 
            />
            <Select
              label="Tipo de Preço"
              options={[
                { value: ServicePricingType.FIXED, label: "Fixo" },
                { value: ServicePricingType.HOURLY, label: "Por Hora" },
              ]}
              value={newServiceForm.pricingType}
              onChange={e => setNewServiceForm(prev => ({...prev, pricingType: e.target.value as ServicePricingType}))}
              required
            />
          </div>
          <Input 
            label="Estimativa de Duração (opcional)" 
            value={newServiceForm.durationEstimate} 
            onChange={e => setNewServiceForm(prev => ({...prev, durationEstimate: e.target.value}))}
            placeholder="ex: 2-4 horas, 1 dia"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-subtext mb-1">Imagens (URLs, separadas por vírgula)</label>
            <Input 
              type="text"
              placeholder="https://exemplo.com/img1.jpg, https://exemplo.com/img2.jpg"
              value={newServiceForm.images?.join(', ')}
              onChange={e => setNewServiceForm(prev => ({...prev, images: e.target.value.split(',').map(url => url.trim()).filter(url => url)}))}
            />
            <p className="text-xs text-gray-500 dark:text-dark-subtext mt-1">Em uma app real, use Supabase Storage para upload.</p>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAddServiceModal(false)}>Cancelar</Button>
            <Button type="submit" variant="gradient">{editingService ? "Salvar Alterações" : "Adicionar Serviço"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


export const ContractFlowPage: React.FC<PageProps> = ({ setCurrentPage, currentUser, params }) => {
  const [step, setStep] = useState(1);
  const [service, setService] = useState<Service | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [contractDetails, setContractDetails] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | null>(null);
  const [isContractConfirmed, setIsContractConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [existingContract, setExistingContract] = useState<Contract | null>(null);


  useEffect(() => {
    const fetchContractData = async () => {
      if (!supabase) {
        setError("Cliente Supabase não inicializado.");
        setLoading(false);
        return;
      }
      setLoading(true);

      if (params?.contractId) {
        // Load existing contract
        const { data: contractData, error: contractError } = await supabase
          .from('contracts')
          .select('*, services(*, categories(id, name, icon_name)), profiles!contracts_professionalId_fkey(*)') // Fetch related service and professional
          .eq('id', params.contractId)
          .single();

        if (contractError || !contractData) {
          setError("Contrato não encontrado.");
          console.error(contractError);
        } else {
          setExistingContract(contractData as Contract);
          const relatedService = (contractData as any).services as Service;
          const relatedProf = (contractData as any).profiles as Professional;
          setService({...relatedService, category: (relatedService as any).categories as Category});
          setProfessional(relatedProf);
          setContractDetails((contractData.chatMessages?.[0]?.text) || ''); // Assuming first message is initial detail
          setStep(2); // Jump to chat/details if contract exists
        }
      } else if (params?.serviceId && params?.professionalId) {
        // New contract flow: fetch service and professional
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*, categories(id, name, icon_name)')
          .eq('id', params.serviceId)
          .single();

        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', params.professionalId)
          .single();

        if (serviceError || !serviceData) setError("Serviço não encontrado.");
        else setService({...serviceData, category: (serviceData as any).categories as Category});
        
        if (profError || !profData) setError("Profissional não encontrado.");
        else setProfessional(profData as Professional);
      } else {
        setError("Informações insuficientes para iniciar a contratação.");
      }
      setLoading(false);
    };

    fetchContractData();
  }, [params]);

  const handleNextStep = async () => {
    if (step === 1 && !service) {
      alert("Selecione um serviço primeiro.");
      return;
    }
    // Step 2 validation is implicit (chat interface)
    if (step === 3 && !paymentMethod && currentUser.userType === UserType.CLIENT && !existingContract) {
      alert("Selecione um método de pagamento.");
      return;
    }
    if (step === 3 && (paymentMethod || existingContract) && currentUser.userType === UserType.CLIENT) { // Final step for client
        if (!supabase || !service || !professional) return;
        
        // If it's a new contract
        if (!existingContract) {
            const newContractData = {
                clientId: currentUser.id,
                professionalId: professional.id,
                serviceId: service.id,
                serviceTitle: service.title, // Denormalized
                priceAgreed: service.price,
                status: ContractStatus.REQUESTED, // Professional needs to accept
                chatMessages: [{ id: `msg${Date.now()}`, senderId: currentUser.id, text: contractDetails, timestamp: new Date().toISOString() }]
            };

            const { data, error: insertError } = await supabase.from('contracts').insert(newContractData).select().single();
            if (insertError) {
                console.error("Error creating contract:", insertError);
                setError("Falha ao criar contrato: " + insertError.message);
                return;
            }
            console.log("New contract created:", data);
        }
        // Else, existing contract is just being viewed or acted upon (not implemented here)
        
        setIsContractConfirmed(true); // Simulate confirmation
        return;
    }
    if (step < 3) setStep(s => s + 1);
  };

  const handlePreviousStep = () => {
    if (step > 1) setStep(s => s + 1);
  };

  if (loading) return <LoadingSpinner message="Carregando detalhes da contratação..." />;
  if (error) return <Alert type="error" message={error} onClose={() => setCurrentPage(Page.CLIENT_HOME)} />;
  if (!service || !professional) return <div className="p-10 text-center">Informações do serviço ou profissional indisponíveis.</div>;


  if (isContractConfirmed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="relative">
          <CheckCircleIcon className="w-32 h-32 text-green-500 mx-auto mb-6" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 bg-yellow-300 rounded-full opacity-0 animate-confetti-burst" style={{animationDelay: '0s'}}></div>
            <div className="w-12 h-12 bg-pink-400 rounded-full opacity-0 animate-confetti-burst" style={{animationDelay: '0.1s', transform: 'translateX(30px) translateY(-20px) rotate(30deg)'}}></div>
            <div className="w-20 h-20 bg-blue-400 rounded-full opacity-0 animate-confetti-burst" style={{animationDelay: '0.2s', transform: 'translateX(-25px) translateY(15px) rotate(-20deg)'}}></div>
          </div>
        </div>
        <h2 className={`text-3xl font-bold mb-4 ${GRADIENT_TEXT_CLASS}`}>
          {existingContract ? "Detalhes do Contrato" : "Pedido de Contrato Enviado!"}
        </h2>
        <p className="text-lg text-gray-700 dark:text-dark-subtext mb-8">
          {existingContract ? `Visualizando contrato com ${professional.name.split(' ')[0]}.` : `${professional.name.split(' ')[0]} revisará seu pedido e entrará em contato.`}
        </p>
        <Button variant="gradient" onClick={() => setCurrentPage(Page.HISTORY)}>Ver Meus Contratos</Button>
      </div>
    );
  }

  const progressPercentage = (step / 3) * 100;

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <Card className="shadow-2xl">
        <h2 className={`text-2xl font-bold mb-2 text-center ${GRADIENT_TEXT_CLASS}`}>
          {existingContract ? "Detalhes do Contrato" : "Contratar Serviço"}
        </h2>
        <p className="text-center text-gray-600 dark:text-dark-subtext mb-6">{service.title} com {professional.name}</p>

        {!existingContract && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-8">
            <div className={`${GRADIENT_BG_CLASS} h-2.5 rounded-full transition-all duration-500 ease-out`} style={{ width: `${progressPercentage}%` }}></div>
            </div>
        )}

        {step === 1 && !existingContract && (
          <div className="animate-slide-in">
            <h3 className="text-xl font-semibold mb-4">1. Detalhes do Serviço</h3>
            <Card className="bg-gray-50 dark:bg-gray-700 !p-4 mb-4">
              <h4 className="font-semibold text-lg">{service.title}</h4>
              <p className="text-sm text-gray-600 dark:text-dark-subtext mb-2">{service.category?.name}</p>
              <p className="text-sm">{service.description}</p>
              <p className={`text-xl font-bold mt-3 ${GRADIENT_TEXT_CLASS}`}>
                R$ {service.price.toFixed(2)}
                {service.pricingType === ServicePricingType.HOURLY && <span className="text-xs font-normal text-gray-500 dark:text-dark-subtext"> /hora</span>}
              </p>
            </Card>
             <TextArea
              label="Alguma observação ou detalhe específico para este serviço?"
              value={contractDetails}
              onChange={(e) => setContractDetails(e.target.value)}
              placeholder="Ex: Preciso que seja feito no período da manhã..."
              rows={3}
            />
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-in">
            <h3 className="text-xl font-semibold mb-4">2. Chat & Detalhes Adicionais</h3>
            <p className="text-sm text-gray-600 dark:text-dark-subtext mb-4">Use este espaço para alinhar os últimos detalhes com {professional.name.split(' ')[0]}. (Simulação de chat)</p>
            <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-gray-50 dark:bg-gray-700 mb-4 space-y-3">
                {contractDetails && ( // Display initial details from user
                    <div className="flex justify-end">
                        <p className="bg-blue-500 text-white p-2 rounded-lg max-w-xs text-sm">{contractDetails}</p>
                    </div>
                )}
                {existingContract?.chatMessages?.slice(1).map(msg => ( // Display subsequent messages if any
                     <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end': 'justify-start'}`}>
                        <p className={`${msg.senderId === currentUser.id ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'} p-2 rounded-lg max-w-xs text-sm`}>{msg.text}</p>
                    </div>
                ))}
                {/* Placeholder for professional's reply */}
                <div className="flex justify-start">
                    <p className="bg-gray-200 dark:bg-gray-600 p-2 rounded-lg max-w-xs text-sm">Olá! Recebi seu pedido. Qual sua disponibilidade?</p>
                </div>
            </div>
            <TextArea
              label="Sua mensagem:"
              placeholder="Digite sua mensagem aqui..."
              rows={3}
              // onChange would update chat state and send message to Supabase in a real app
            />
          </div>
        )}
        
        {step === 3 && currentUser.userType === UserType.CLIENT && !existingContract && (
          <div className="animate-slide-in">
            <h3 className="text-xl font-semibold mb-4">3. Pagamento</h3>
            <p className="text-gray-600 dark:text-dark-subtext mb-1">Valor Total: <span className={`font-bold text-xl ${GRADIENT_TEXT_CLASS}`}>R$ {service.price.toFixed(2)}</span></p>
            <p className="text-sm text-gray-500 dark:text-dark-subtext mb-6">Selecione o método de pagamento. (Simulação).</p>
            <div className="space-y-3">
              <Button 
                variant={paymentMethod === 'pix' ? 'gradient' : 'secondary'} 
                className="w-full justify-start"
                onClick={() => setPaymentMethod('pix')}
                leftIcon={<img src="https://logopng.com.br/logos/pix-107.svg" alt="PIX" className="w-6 h-6 mr-2"/>}
              >
                Pagar com PIX
              </Button>
              <Button 
                variant={paymentMethod === 'card' ? 'gradient' : 'secondary'} 
                className="w-full justify-start"
                onClick={() => setPaymentMethod('card')}
                leftIcon={<CreditCardIcon className="w-6 h-6 mr-2" />}
              >
                Pagar com Cartão de Crédito
              </Button>
            </div>
            {paymentMethod === 'card' && (
              <div className="mt-6 space-y-3 p-4 border rounded-md bg-gray-50 dark:bg-gray-700">
                <Input label="Número do Cartão" placeholder="0000 0000 0000 0000" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Validade" placeholder="MM/AA" />
                  <Input label="CVV" placeholder="123" />
                </div>
                <Input label="Nome no Cartão" placeholder="Seu Nome Completo" />
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-between items-center">
          <Button variant="secondary" onClick={handlePreviousStep} disabled={step === 1 || !!existingContract}>
            Voltar
          </Button>
          <Button variant="gradient" onClick={handleNextStep} disabled={ (step === 3 && !paymentMethod && currentUser.userType === UserType.CLIENT && !existingContract) }>
            {step === 3 && !existingContract ? (currentUser.userType === UserType.CLIENT ? "Confirmar e Pagar" : "Aprovar Pedido") 
                : existingContract ? (currentUser.userType === UserType.PROFESSIONAL && existingContract.status === ContractStatus.REQUESTED ? "Aceitar Pedido" : "Fechar Detalhes")
                : "Próximo"}
          </Button>
        </div>
      </Card>
    </div>
  );
};
const CreditCardIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
  </svg>
);


export const HistoryPage: React.FC<PageProps> = ({ setCurrentPage, currentUser }) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!supabase || !currentUser) return;
      setLoading(true);
      setError(null);

      const query = supabase.from('contracts').select('*, profiles!contracts_professionalId_fkey(name), services(title)') // Fetch professional name and service title
        .order('createdAt', { ascending: false });
      
      if (currentUser.userType === UserType.CLIENT) {
        query.eq('clientId', currentUser.id);
      } else {
        query.eq('professionalId', currentUser.id);
      }

      const { data, error: contractError } = await query;

      if (contractError) {
        console.error("Error fetching contracts:", contractError);
        setError("Não foi possível carregar o histórico de contratos.");
      } else {
        // Map data to include denormalized fields easily
        const formattedContracts = data?.map((c: any) => ({
            ...c,
            professionalName: c.profiles?.name, // From join with profiles table
            serviceTitle: c.services?.title,   // From join with services table
        })) || [];
        setContracts(formattedContracts);
      }
      setLoading(false);
    };

    fetchContracts();
  }, [currentUser]);

  const getStatusClass = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.COMPLETED: return 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100';
      case ContractStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100';
      case ContractStatus.PENDING_PAYMENT:
      case ContractStatus.REQUESTED: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100';
      case ContractStatus.CANCELLED: return 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100';
    }
  };

  if (loading) return <LoadingSpinner message="Carregando histórico..." />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-dark-text mb-6">Histórico de Contratos</h1>
      {contracts.length === 0 ? (
        <Card className="text-center py-10">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <p className="text-gray-600 dark:text-dark-subtext">Você ainda não possui contratos.</p>
          {currentUser.userType === UserType.CLIENT && (
            <Button variant="gradient" className="mt-4" onClick={() => setCurrentPage(Page.CLIENT_HOME)}>
              Encontrar Serviços
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {contracts.map(contract => (
            <Card key={contract.id} className="hover:shadow-xl transition-shadow" onClick={() => setCurrentPage(Page.CONTRACT_FLOW, { contractId: contract.id })}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text">{contract.serviceTitle || "Serviço Indisponível"}</h3>
                  <p className="text-sm text-gray-500 dark:text-dark-subtext">
                    {currentUser.userType === UserType.CLIENT 
                      ? `Profissional: ${(contract as any).professionalName || 'N/A'}`
                      : `Cliente ID: ${contract.clientId}`}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Data: {new Date(contract.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="mt-3 sm:mt-0 flex flex-col items-start sm:items-end">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(contract.status)}`}>
                    {contract.status.replace('_', ' ')}
                  </span>
                  <p className={`text-lg font-bold mt-1 ${GRADIENT_TEXT_CLASS}`}>R$ {contract.priceAgreed.toFixed(2)}</p>
                </div>
              </div>
               {contract.status === ContractStatus.COMPLETED && currentUser.userType === UserType.CLIENT && (
                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); alert("Abrir modal de avaliação para: " + (contract.serviceTitle || "Serviço")); }}>
                    Avaliar Serviço
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


export const ProfileEditPage: React.FC<PageProps> = ({ setCurrentPage, currentUser }) => {
  const [profile, setProfile] = useState<UserProfile | Professional>(currentUser);
  const [isSaving, setIsSaving] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    // Ensure profile state is updated if currentUser prop changes (e.g., after initial load)
    setProfile(currentUser);
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecializationsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (profile.userType === UserType.PROFESSIONAL) {
        const specializations = e.target.value.split(',').map(s => s.trim());
        setProfile(prev => ({ ...prev, specializations } as Professional));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsSaving(true);
    setAlertInfo(null);

    const { userType, created_at, updated_at, email, user_id, id, ...profileDataToSave } = profile;
    // email and user_id are usually not updated here directly.
    // id is the primary key for the 'profiles' table.

    // If it's a new profile (currentUser.id might be empty or a temp one if just signed up)
    // The `currentUser` from `App.tsx` should have the Supabase `auth.user.id` in `user_id`
    // and potentially a profiles.id if it already exists.

    let operation;
    // Check if profile exists by its `id` (PK of profiles table)
    // If currentUser.id is defined and not a placeholder, it's an update.
    // If currentUser.id is not from DB yet, it's an insert (profile creation after signup)
    // This logic assumes `currentUser.id` is the `profiles.id`. If it's empty, we need to insert.

    const isExistingProfile = !!currentUser.id; // Check if the profile ID from DB exists

    if (isExistingProfile) {
        operation = supabase
        .from('profiles')
        .update(profileDataToSave)
        .eq('id', currentUser.id) // Use profile's own ID for update
        .select()
        .single();
    } else {
        // New profile: ensure user_id (from auth) and userType are set.
        // `id` will be auto-generated by Supabase.
        operation = supabase
        .from('profiles')
        .insert({
            ...profileDataToSave,
            user_id: currentUser.user_id, // This MUST come from the authenticated Supabase user
            userType: profile.userType, // User selects this during profile creation
            email: currentUser.email // Comes from authenticated Supabase user
        })
        .select()
        .single();
    }
    
    const { data: savedProfile, error } = await operation;

    setIsSaving(false);
    if (error) {
      console.error("Error saving profile:", error);
      setAlertInfo({type: 'error', message: `Erro ao salvar perfil: ${error.message || 'Erro desconhecido.'}`});
    } else {
      setAlertInfo({type: 'success', message: 'Perfil atualizado com sucesso!'});
      console.log("Profile saved:", savedProfile);
      // Potentially update currentUser in App.tsx context or state if this component doesn't get it via props
      // setCurrentPage(profile.userType === UserType.CLIENT ? Page.CLIENT_HOME : Page.PROFESSIONAL_DASHBOARD); // Navigate away
    }
    setTimeout(() => setAlertInfo(null), 3000);
  };
  
  // If currentUser is not yet loaded (e.g. initial state in App.tsx before auth resolves)
  if (!profile?.user_id && !currentUser?.user_id) { // Check user_id as it's critical
      return <LoadingSpinner message="Carregando dados do perfil..." />;
  }


  return (
    <div className="container mx-auto p-4 md:p-8 max-w-2xl">
      <Card className="shadow-xl">
        <h1 className={`text-2xl font-bold mb-6 ${GRADIENT_TEXT_CLASS}`}>Editar Perfil</h1>
        {alertInfo && <div className="mb-4"><Alert type={alertInfo.type} message={alertInfo.message} onClose={() => setAlertInfo(null)} /></div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-4">
            <img 
              src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.name?.replace(/\s/g, '+')}&background=random`} 
              alt={profile.name} 
              className="w-24 h-24 rounded-full object-cover shadow-md"
            />
            <div>
              <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 dark:text-dark-subtext mb-1">URL do Avatar</label>
              <Input type="url" name="avatarUrl" id="avatarUrl" value={profile.avatarUrl || ''} onChange={handleChange} placeholder="https://exemplo.com/avatar.jpg"/>
            </div>
          </div>

          <Input label="Nome Completo" name="name" value={profile.name} onChange={handleChange} required />
          <Input label="Email" name="email" type="email" value={profile.email} disabled /> {/* Email from Supabase Auth, not editable here */}
          
          {/* User Type Selection - only for new profiles, otherwise it's fixed */}
          {!currentUser?.id && ( // Show only if it's a new profile (no existing DB ID)
            <Select 
                label="Eu sou um:"
                name="userType"
                value={profile.userType}
                onChange={handleChange}
                options={[
                    {value: UserType.CLIENT, label: "Cliente (buscando serviços)"},
                    {value: UserType.PROFESSIONAL, label: "Profissional (oferecendo serviços)"}
                ]}
                required
            />
          )}

          <Input label="Telefone (opcional)" name="phone" value={profile.phone || ''} onChange={handleChange} />
          <Input label="Localização (opcional)" name="location" value={profile.location || ''} onChange={handleChange} />
          <TextArea label="Bio / Sobre mim" name="bio" value={profile.bio || ''} onChange={handleChange} rows={4} />

          {profile.userType === UserType.PROFESSIONAL && (
            <>
              <Input 
                label="Especializações (separadas por vírgula)" 
                name="specializations" 
                value={(profile as Professional).specializations?.join(', ') || ''} 
                onChange={handleSpecializationsChange} 
                placeholder="Ex: Eletricista Residencial, Reparos Urgentes"
              />
               <Select 
                label="Status Atual"
                name="status"
                value={(profile as Professional).status || 'Available'}
                onChange={handleChange}
                options={[
                    { value: 'Available', label: 'Disponível' },
                    { value: 'Busy', label: 'Ocupado' },
                    { value: 'Away', label: 'Ausente' },
                ]}
                />
            </>
          )}

          <div className="flex justify-end pt-4">
            <Button type="submit" variant="gradient" isLoading={isSaving} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export const NotificationsPage: React.FC<PageProps> = ({ currentUser, setCurrentPage }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const fetchNotifications = async () => {
        if (!supabase || !currentUser?.id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('userId', currentUser.id)
          .order('createdAt', { ascending: false });
        
        if (error) console.error("Error fetching notifications:", error);
        else setNotifications(data || []);
        setLoading(false);
      };
      fetchNotifications();
    }, [currentUser?.id]);
  
    const markAsRead = async (notificationId: string) => {
      if (!supabase) return;
      
      const { error } = await supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('id', notificationId);

      if (error) {
          console.error("Error marking notification as read:", error);
      } else {
          setNotifications(prevNotifications =>
            prevNotifications.map(n =>
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          );
      }
    };

    const handleNotificationClick = (notification: AppNotification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        if (notification.linkTo) {
            setCurrentPage(notification.linkTo.page, notification.linkTo.params);
        }
    };
  
    if(loading) return <LoadingSpinner message="Carregando notificações..." />;

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-dark-text mb-6">Notificações</h1>
        {notifications.length === 0 ? (
          <Card className="text-center py-10">
            <BellIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <p className="text-gray-600 dark:text-dark-subtext">Você não tem nenhuma notificação.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map(notification => (
              <Card 
                key={notification.id} 
                className={`transition-all duration-300 ${notification.isRead ? 'opacity-70 bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-dark-surface hover:shadow-lg'} ${notification.linkTo ? 'cursor-pointer' : ''}`}
                onClick={notification.linkTo ? () => handleNotificationClick(notification) : undefined}
              >
                <div className="flex items-start space-x-3">
                    <div className={`mt-1 flex-shrink-0 w-3 h-3 rounded-full ${notification.isRead ? 'bg-gray-400' : GRADIENT_BG_CLASS}`}></div>
                    <div className="flex-grow">
                        <h3 className={`font-semibold ${notification.isRead ? 'text-gray-700 dark:text-dark-subtext' : 'text-gray-800 dark:text-dark-text'}`}>{notification.title}</h3>
                        <p className={`text-sm ${notification.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>{notification.message}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                    </div>
                    {!notification.isRead && (
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}>
                        Marcar como lida
                    </Button>
                    )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };