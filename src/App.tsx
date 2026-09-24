import { useState, useMemo } from 'react';
import {
  StepId,
  OrderCustomerInfo,
} from './types/builder';
import {
  SWITCH_OPTIONS,
  KEYCAP_OPTIONS,
  CASE_OPTIONS,
  EXTRA_OPTIONS,
} from './data/builderData';
import { Header } from './components/Header';
import { SwitchStep } from './components/Steps/SwitchStep';
import { KeycapStep } from './components/Steps/KeycapStep';
import { CaseStep } from './components/Steps/CaseStep';
import { ExtrasStep } from './components/Steps/ExtrasStep';
import { ReviewStep } from './components/Steps/ReviewStep';
import { SoundTesterModal } from './components/SoundTesterModal';
import { CheckoutSuccessModal } from './components/CheckoutSuccessModal';
import { CartDrawer } from './components/CartDrawer';

export function App() {
  const [currentStep, setCurrentStep] = useState<StepId>('switches');

  // Custom Build Selections
  const [selectedSwitchId, setSelectedSwitchId] = useState<string>('sw-silent-pink');
  const [selectedKeycapId, setSelectedKeycapId] = useState<string>('kc-retro-pastel');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('cs-midnight-black');
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>(['ex-aviator-cable']);

  // Modals & Drawers
  const [isSoundModalOpen, setIsSoundModalOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [orderCustomer, setOrderCustomer] = useState<OrderCustomerInfo | null>(null);

  // Derived Active Items
  const selectedSwitch = useMemo(
    () => SWITCH_OPTIONS.find((s) => s.id === selectedSwitchId) || SWITCH_OPTIONS[0],
    [selectedSwitchId]
  );

  const selectedKeycap = useMemo(
    () => KEYCAP_OPTIONS.find((k) => k.id === selectedKeycapId) || KEYCAP_OPTIONS[0],
    [selectedKeycapId]
  );

  const selectedCase = useMemo(
    () => CASE_OPTIONS.find((c) => c.id === selectedCaseId) || CASE_OPTIONS[0],
    [selectedCaseId]
  );

  const selectedExtras = useMemo(
    () => EXTRA_OPTIONS.filter((e) => selectedExtraIds.includes(e.id)),
    [selectedExtraIds]
  );

  // Total Price Computation
  const totalPrice = useMemo(() => {
    const switchPrice = selectedSwitch.price;
    const keycapPrice = selectedKeycap.price;
    const casePrice = selectedCase.price;
    const extrasPrice = selectedExtras.reduce((sum, item) => sum + item.price, 0);
    return switchPrice + keycapPrice + casePrice + extrasPrice;
  }, [selectedSwitch, selectedKeycap, selectedCase, selectedExtras]);

  const totalItemsCount = 3 + selectedExtras.length;

  // Extra toggle handler
  const handleToggleExtra = (extraId: string) => {
    setSelectedExtraIds((prev) =>
      prev.includes(extraId) ? prev.filter((id) => id !== extraId) : [...prev, extraId]
    );
  };

  const handleRemoveExtra = (extraId: string) => {
    setSelectedExtraIds((prev) => prev.filter((id) => id !== extraId));
  };

  // Step Transitions
  const handleNextStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    switch (currentStep) {
      case 'switches':
        setCurrentStep('keycaps');
        break;
      case 'keycaps':
        setCurrentStep('case');
        break;
      case 'case':
        setCurrentStep('extras');
        break;
      case 'extras':
        setCurrentStep('review');
        break;
      case 'review':
        break;
    }
  };

  const handlePreviousStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    switch (currentStep) {
      case 'keycaps':
        setCurrentStep('switches');
        break;
      case 'case':
        setCurrentStep('keycaps');
        break;
      case 'extras':
        setCurrentStep('case');
        break;
      case 'review':
        setCurrentStep('extras');
        break;
    }
  };

  const handleOrderComplete = (customerInfo: OrderCustomerInfo) => {
    setOrderCustomer(customerInfo);
    setIsSuccessModalOpen(true);
  };

  const handleResetBuild = () => {
    setSelectedSwitchId('sw-silent-pink');
    setSelectedKeycapId('kc-retro-pastel');
    setSelectedCaseId('cs-midnight-black');
    setSelectedExtraIds(['ex-aviator-cable']);
    setCurrentStep('switches');
    setIsSuccessModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-slate-100">
      {/* Top Header */}
      <Header
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        totalPrice={totalPrice}
        totalItems={totalItemsCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenSoundTester={() => setIsSoundModalOpen(true)}
      />

      {/* Main Flow Canvas */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentStep === 'switches' && (
          <SwitchStep
            switches={SWITCH_OPTIONS}
            selectedSwitchId={selectedSwitchId}
            onSelectSwitch={setSelectedSwitchId}
            onNext={handleNextStep}
            totalPrice={totalPrice}
            onOpenSoundModal={() => setIsSoundModalOpen(true)}
          />
        )}

        {currentStep === 'keycaps' && (
          <KeycapStep
            keycaps={KEYCAP_OPTIONS}
            selectedKeycapId={selectedKeycapId}
            onSelectKeycap={setSelectedKeycapId}
            onPrevious={handlePreviousStep}
            onNext={handleNextStep}
            totalPrice={totalPrice}
          />
        )}

        {currentStep === 'case' && (
          <CaseStep
            cases={CASE_OPTIONS}
            selectedCaseId={selectedCaseId}
            onSelectCase={setSelectedCaseId}
            onPrevious={handlePreviousStep}
            onNext={handleNextStep}
            totalPrice={totalPrice}
          />
        )}

        {currentStep === 'extras' && (
          <ExtrasStep
            extras={EXTRA_OPTIONS}
            selectedExtraIds={selectedExtraIds}
            onToggleExtra={handleToggleExtra}
            onPrevious={handlePreviousStep}
            onNext={handleNextStep}
            totalPrice={totalPrice}
          />
        )}

        {currentStep === 'review' && (
          <ReviewStep
            selectedSwitch={selectedSwitch}
            selectedKeycap={selectedKeycap}
            selectedCase={selectedCase}
            selectedExtras={selectedExtras}
            totalPrice={totalPrice}
            onPrevious={handlePreviousStep}
            onOrderComplete={handleOrderComplete}
          />
        )}
      </main>

      {/* Sound Testing Modal */}
      <SoundTesterModal
        isOpen={isSoundModalOpen}
        onClose={() => setIsSoundModalOpen(false)}
        switches={SWITCH_OPTIONS}
        activeSwitchId={selectedSwitchId}
        onSelectSwitch={setSelectedSwitchId}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        selectedSwitch={selectedSwitch}
        selectedKeycap={selectedKeycap}
        selectedCase={selectedCase}
        selectedExtras={selectedExtras}
        onRemoveExtra={handleRemoveExtra}
        totalPrice={totalPrice}
        onNavigateStep={setCurrentStep}
      />

      {/* Checkout Success Modal */}
      <CheckoutSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        customerInfo={orderCustomer}
        selectedSwitch={selectedSwitch}
        selectedKeycap={selectedKeycap}
        selectedCase={selectedCase}
        selectedExtras={selectedExtras}
        totalPrice={totalPrice}
        onResetBuild={handleResetBuild}
      />
    </div>
  );
}

export default App;
