import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import HomePage from './pages/HomePage.jsx';
import UsernameGenerator from './components/UsernameGenerator.jsx';
import CaseConverter from './components/CaseConverter.jsx';
import RemoveDuplicates from './components/RemoveDuplicates.jsx';
import JsonFormatter from './components/JsonFormatter.jsx';
import AgeCalculator from './components/AgeCalculator.jsx';
import TimeDurationCalculator from './components/TimeDurationCalculator.jsx';
import DiscountCalculator from './components/DiscountCalculator.jsx';
import TipCalculator from './components/TipCalculator.jsx';
import InterestCalculator from './components/InterestCalculator.jsx';
import BMICalculator from './components/BMICalculator.jsx';
import UnitConverter from './components/UnitConverter.jsx';
import LoanCalculator from './components/LoanCalculator.jsx';
import MortgageCalculator from './components/MortgageCalculator.jsx';
import CurrencyConverter from './components/CurrencyConverter.jsx';
import TaxCalculator from './components/TaxCalculator.jsx'
import USTaxCalculator from './components/USTaxCalculator.jsx';
import EMICalculator from './components/EMICalculator.jsx';
import CompoundInterestCalculator from './components/CompoundInterestCalculator.jsx';
import RetirementCalculator from './components/RetirementCalculator.jsx';
import InvestmentCalculator from './components/InvestmentCalculator.jsx';
import ProfitMarginCalculator from './components/ProfitMarginCalculator.jsx';
import InflationCalculator from './components/InflationCalculator.jsx';
import ROICalculator from './components/ROICalculator.jsx';
import SavingsCalculator from './components/SavingsCalculator.jsx';
import ScientificCalculator from './components/ScientificCalculator.jsx';
import FractionCalculator from './components/FractionCalculator.jsx';
import AlgebraCalculator from './components/AlgebraCalculator.jsx';
import EquationSolver from './components/EquationSolver.jsx';
import LogarithmCalculator from './components/LogarithmCalculator.jsx';
import SquareRootCalculator from './components/SquareRootCalculator.jsx';
import ExponentCalculator from './components/ExponentCalculator.jsx';
import MeanMedianModeCalculator from './components/MeanMedianModeCalculator.jsx';
import StandardDeviationCalculator from './components/StandardDeviationCalculator.jsx';
import RandomNumberGenerator from './components/RandomNumberGenerator.jsx';
import BMRCalculator from './components/BMRCalculator.jsx';
import CalorieCalculator from './components/CalorieCalculator.jsx';
import BodyFatCalculator from './components/BodyFatCalculator.jsx';
import IdealWeightCalculator from './components/IdealWeightCalculator.jsx';
import WaterIntakeCalculator from './components/WaterIntakeCalculator.jsx';
import PregnancyDueDateCalculator from './components/PregnancyDueDateCalculator.jsx';
import OvulationCalculator from './components/OvulationCalculator.jsx'
import MacroCalculator from './components/MacroCalculator.jsx';
import DateCalculator from './components/DateCalculator.jsx';
import WorkHoursCalculator from './components/WorkHoursCalculator.jsx';
import GPACalculator from './components/GPACalculator.jsx';
import GradeCalculator from './components/GradeCalculator.jsx';
import FinalExamCalculator from './components/FinalExamCalculator.jsx';
import FuelCostCalculator from './components/FuelCostCalculator.jsx';
import ElectricityBillCalculator from './components/ElectricityBillCalculator.jsx';
import ConcreteCalculator from './components/ConcreteCalculator.jsx';
import TileCalculator from './components/TileCalculator.jsx';
import AreaCalculator from './components/AreaCalculator.jsx';
import VolumeCalculator from './components/VolumeCalculator.jsx';
import SIPCalculator from './components/SIPCalculator.jsx';
import PaceCalculator from './components/PaceCalculator.jsx';
import SalesTaxCalculator from './components/SalesTaxCalculator.jsx';
import AutoLoanCalculator from './components/AutoLoanCalculator.jsx';
import MilesToStepsCalculator from './components/MilesToStepsCalculator.jsx';
import BaudRateCalculator from './components/BaudRateCalculator.jsx';
import MatrixCalculator from './components/MatrixCalculator.jsx';
import BinaryCalculator from './components/BinaryCalculator.jsx';
import IntegralCalculator from './components/IntegralCalculator.jsx';
import WHRCalculator from './components/WHRCalculator.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsOfService from './pages/TermsOfService.jsx';
import ContactPage from './pages/ContactPage.jsx';
import NotFound from './pages/NotFound.jsx';
import PercentageCalculator from './components/PercentageCalculator.jsx';
import SalaryCalculator from './components/SalaryCalculator.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
export default function App() {
  return (
    <div className="page-wrapper">
      <ScrollToTop />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/username-generator" element={<UsernameGenerator />} />
          <Route path="/case-converter" element={<CaseConverter />} />
          <Route path="/remove-duplicates" element={<RemoveDuplicates />} />
          <Route path="/json-formatter" element={<JsonFormatter />} />
          <Route path="/age-calculator" element={<AgeCalculator />} />
          <Route path="/percentage-calculator" element={<PercentageCalculator />} />
          <Route path="/time-duration-calculator" element={<TimeDurationCalculator />} />
          <Route path="/discount-calculator" element={<DiscountCalculator />} />
          <Route path="/tip-calculator" element={<TipCalculator />} />
          <Route path="/interest-calculator" element={<InterestCalculator />} />
          <Route path="/bmi-calculator" element={<BMICalculator />} />
          <Route path="/salary-calculator" element={<SalaryCalculator />} />
          <Route path="/unit-converter" element={<UnitConverter />} />
          <Route path="/loan-calculator" element={<LoanCalculator />} />
          <Route path="/mortgage-calculator" element={<MortgageCalculator />} />
          <Route path="/currency-converter" element={<CurrencyConverter />} />
          <Route path="/tax-calculator" element={<TaxCalculator />} />
          <Route path="/us-tax-calculator" element={<USTaxCalculator />} />
          <Route path="/emi-calculator" element={<EMICalculator />} />
          <Route path="/compound-interest-calculator" element={<CompoundInterestCalculator />} />
          <Route path="/retirement-calculator" element={<RetirementCalculator />} />
          <Route path="/investment-calculator" element={<InvestmentCalculator />} />
          <Route path="/profit-margin-calculator" element={<ProfitMarginCalculator />} />
          <Route path="/inflation-calculator" element={<InflationCalculator />} />
          <Route path="/roi-calculator" element={<ROICalculator />} />
          <Route path="/savings-calculator" element={<SavingsCalculator />} />
          <Route path="/scientific-calculator" element={<ScientificCalculator />} />
          <Route path="/fraction-calculator" element={<FractionCalculator />} />
          <Route path="/algebra-calculator" element={<AlgebraCalculator />} />
          <Route path="/equation-solver" element={<EquationSolver />} />
          <Route path="/logarithm-calculator" element={<LogarithmCalculator />} />
          <Route path="/square-root-calculator" element={<SquareRootCalculator />} />
          <Route path="/exponent-calculator" element={<ExponentCalculator />} />
          <Route path="/mean-median-mode-calculator" element={<MeanMedianModeCalculator />} />
          <Route path="/standard-deviation-calculator" element={<StandardDeviationCalculator />} />
          <Route path="/random-number-generator" element={<RandomNumberGenerator />} />
          <Route path="/bmr-calculator" element={<BMRCalculator />} />
          <Route path="/calorie-calculator" element={<CalorieCalculator />} />
          <Route path="/body-fat-calculator" element={<BodyFatCalculator />} />
          <Route path="/ideal-weight-calculator" element={<IdealWeightCalculator />} />
          <Route path="/water-intake-calculator" element={<WaterIntakeCalculator />} />
          <Route path="/pregnancy-due-date-calculator" element={<PregnancyDueDateCalculator />} />
          <Route path="/ovulation-calculator" element={<OvulationCalculator />} />
          <Route path="/macro-calculator" element={<MacroCalculator />} />
          <Route path="/date-calculator" element={<DateCalculator />} />
          <Route path="/work-hours-calculator" element={<WorkHoursCalculator />} />
          <Route path="/gpa-calculator" element={<GPACalculator />} />
          <Route path="/grade-calculator" element={<GradeCalculator />} />
          <Route path="/final-exam-calculator" element={<FinalExamCalculator />} />
          <Route path="/fuel-cost-calculator" element={<FuelCostCalculator />} />
          <Route path="/electricity-bill-calculator" element={<ElectricityBillCalculator />} />
          <Route path="/concrete-calculator" element={<ConcreteCalculator />} />
          <Route path="/tile-calculator" element={<TileCalculator />} />
          <Route path="/area-calculator" element={<AreaCalculator />} />
          <Route path="/volume-calculator" element={<VolumeCalculator />} />
          <Route path="/sip-calculator" element={<SIPCalculator />} />
          <Route path="/pace-calculator" element={<PaceCalculator />} />
          <Route path="/sales-tax-calculator" element={<SalesTaxCalculator />} />
          <Route path="/auto-loan-calculator" element={<AutoLoanCalculator />} />
          <Route path="/miles-to-steps-calculator" element={<MilesToStepsCalculator />} />
          <Route path="/baud-rate-calculator" element={<BaudRateCalculator />} />
          <Route path="/matrix-calculator" element={<MatrixCalculator />} />
          <Route path="/binary-calculator" element={<BinaryCalculator />} />
          <Route path="/integral-calculator" element={<IntegralCalculator />} />
          <Route path="/whr-calculator" element={<WHRCalculator />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
