import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useBroker } from '../../../context/BrokerContext.jsx';
import './newProperty.css';

function AccordionSection({ 
  title, 
  children, 
  isOpen, 
  onToggle, 
  progress = 0, 
  progressLabel = null,
  stepNumber,
  canEdit = true
}) {
  const handleEditClick = (e) => {
    e.stopPropagation();
    if (canEdit) {
      onToggle();
    }
  };

  const handleHeaderClick = () => {
    if (canEdit || stepNumber === 1) {
      onToggle();
    }
  };

  return (
    <div className={`np-accordion-section ${isOpen ? 'np-accordion-open' : ''} ${!canEdit && stepNumber > 1 ? 'np-accordion-locked' : ''}`}>
      <div className="np-accordion-header" onClick={handleHeaderClick} style={{ cursor: (canEdit || stepNumber === 1) ? 'pointer' : 'not-allowed', opacity: (!canEdit && stepNumber > 1) ? 0.6 : 1 }}>
        <div className="np-accordion-header-left">
          <span className="np-step-number">{stepNumber}</span>
          <span className="np-accordion-title">{title}</span>
        </div>
        <div className="np-accordion-header-right">
          <div className="np-progress-wrapper">
            <div className="np-progress-bar">
              <div className="np-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            {progressLabel && <span className="np-progress-text">{progressLabel}</span>}
          </div>
          {canEdit && (
            <button type="button" className="np-edit-btn" onClick={handleEditClick}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11.333 2.00004C11.5084 1.82473 11.7163 1.68604 11.9439 1.59231C12.1715 1.49858 12.4142 1.45166 12.6593 1.45431C12.9044 1.45696 13.146 1.50911 13.3707 1.60735C13.5954 1.70559 13.7985 1.84783 13.968 2.02537C14.1375 2.20291 14.2699 2.41211 14.3578 2.64048C14.4457 2.86885 14.4873 3.11189 14.48 3.35604C14.4727 3.60019 14.4167 3.84059 14.3147 4.06271C14.2128 4.28483 14.067 4.48418 13.886 4.64837L13.333 5.20004L10.8 2.66671L11.333 2.00004ZM9.86667 3.53337L2.66667 10.7334V13.2667H5.2L12.4 6.06671L9.86667 3.53337Z" fill="currentColor"/>
              </svg>
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>
      {isOpen && (
        <div className="np-accordion-content">
          {children}
        </div>
      )}
    </div>
  );
}

// Property field configurations by property type
const propertyFieldConfig = {
  // Group 1: Residential properties with built-up area, bedrooms, etc.
  flat: {
    areaType: 'built_up',
    showBedrooms: true,
    showBathrooms: true,
    showBalconies: true,
    showFloors: true,
    showPropertyOnFloor: true,
    showFurnishing: true,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: true,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  independent_house: {
    areaType: 'built_up',
    showBedrooms: true,
    showBathrooms: true,
    showBalconies: true,
    showFloors: true,
    showPropertyOnFloor: true,
    showFurnishing: true,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: true,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  guest_house: {
    areaType: 'built_up',
    showBedrooms: true,
    showBathrooms: true,
    showBalconies: true,
    showFloors: true,
    showPropertyOnFloor: true,
    showFurnishing: true,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: true,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  hotel_restaurant: {
    areaType: 'built_up',
    showBedrooms: true,
    showBathrooms: true,
    showBalconies: true,
    showFloors: true,
    showPropertyOnFloor: true,
    showFurnishing: true,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: true,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  builder_floor: {
    areaType: 'built_up',
    showBedrooms: true,
    showBathrooms: true,
    showBalconies: true,
    showFloors: true,
    showPropertyOnFloor: true,
    showFurnishing: true,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: true,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  farm_house: {
    areaType: 'built_up',
    showBedrooms: true,
    showBathrooms: true,
    showBalconies: true,
    showFloors: true,
    showPropertyOnFloor: true,
    showFurnishing: true,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: true,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  villa: {
    areaType: 'built_up',
    showBedrooms: true,
    showBathrooms: true,
    showBalconies: true,
    showFloors: true,
    showPropertyOnFloor: false,
    showFurnishing: true,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: true,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  // Group 2: Land/Plot properties
  residential_land: {
    areaType: 'plot_land',
    showBedrooms: false,
    showBathrooms: false,
    showBalconies: false,
    showFloors: false,
    showPropertyOnFloor: false,
    showFurnishing: false,
    showFacing: false,
    showFlooring: false,
    showAge: false,
    showAdditionalRooms: false,
    showPropertyTags: false,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'rera_status'],
    conditionalMandatory: {
      rera_number: (f) => f.rera_status === 'registered'
    }
  },
  farm_agricultural_land: {
    areaType: 'plot_land',
    showBedrooms: false,
    showBathrooms: false,
    showBalconies: false,
    showFloors: false,
    showPropertyOnFloor: false,
    showFurnishing: false,
    showFacing: false,
    showFlooring: false,
    showAge: false,
    showAdditionalRooms: false,
    showPropertyTags: false,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'rera_status'],
    conditionalMandatory: {
      rera_number: (f) => f.rera_status === 'registered'
    }
  },
  commercial_plot: {
    areaType: 'plot_land',
    showBedrooms: false,
    showBathrooms: false,
    showBalconies: false,
    showFloors: false,
    showPropertyOnFloor: false,
    showFurnishing: false,
    showFacing: false,
    showFlooring: false,
    showAge: false,
    showAdditionalRooms: false,
    showPropertyTags: false,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'rera_status'],
    conditionalMandatory: {
      rera_number: (f) => f.rera_status === 'registered'
    }
  },
  industrial_land: {
    areaType: 'plot_land',
    showBedrooms: false,
    showBathrooms: false,
    showBalconies: false,
    showFloors: false,
    showPropertyOnFloor: false,
    showFurnishing: false,
    showFacing: false,
    showFlooring: false,
    showAge: false,
    showAdditionalRooms: false,
    showPropertyTags: false,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'rera_status'],
    conditionalMandatory: {
      rera_number: (f) => f.rera_status === 'registered'
    }
  },
  // Group 3: Penthouse, Studio Apartment (similar to group 1 but might have different defaults)
  penthouse: {
    areaType: 'built_up',
    showBedrooms: true,
    showBathrooms: true,
    showBalconies: true,
    showFloors: true,
    showPropertyOnFloor: true,
    showFurnishing: true,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: true,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  studio_apartment: {
    areaType: 'built_up',
    showBedrooms: true,
    showBathrooms: true,
    showBalconies: true,
    showFloors: true,
    showPropertyOnFloor: true,
    showFurnishing: true,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: true,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  // Group 4: Commercial spaces
  commercial_shop: {
    areaType: 'built_up',
    showBedrooms: false,
    showBathrooms: false,
    showBalconies: false,
    showFloors: true,
    showPropertyOnFloor: true,
    showFurnishing: false,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: false,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'age_years', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  showroom: {
    areaType: 'built_up',
    showBedrooms: false,
    showBathrooms: false,
    showBalconies: false,
    showFloors: true,
    showPropertyOnFloor: true,
    showFurnishing: false,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: false,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'age_years', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  office_space: {
    areaType: 'built_up',
    showBedrooms: false,
    showBathrooms: false,
    showBalconies: false,
    showFloors: true,
    showPropertyOnFloor: true,
    showFurnishing: false,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: false,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'age_years', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  business_center: {
    areaType: 'built_up',
    showBedrooms: false,
    showBathrooms: false,
    showBalconies: false,
    showFloors: true,
    showPropertyOnFloor: true,
    showFurnishing: false,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: false,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'age_years', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  // Group 6: Warehouse/Godown
  warehouse_godown: {
    areaType: 'built_up',
    showBedrooms: false,
    showBathrooms: false,
    showBalconies: false,
    showFloors: true,
    showPropertyOnFloor: false,
    showFurnishing: false,
    showFacing: true,
    showFlooring: false,
    showAge: true,
    showAdditionalRooms: false,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'age_years', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  },
  // Group 7: Factory
  factory: {
    areaType: 'built_up',
    showBedrooms: false,
    showBathrooms: false,
    showBalconies: false,
    showFloors: true,
    showPropertyOnFloor: false,
    showFurnishing: false,
    showFacing: true,
    showFlooring: false,
    showAge: true,
    showAdditionalRooms: false,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'sale_type', 'no_of_floors', 'availability', 'age_years', 'rera_status'],
    conditionalMandatory: {
      possession_by: (f) => f.availability !== 'ready_to_move',
      rera_number: (f) => f.rera_status === 'registered',
      age_years: (f) => f.availability === 'ready_to_move'
    }
  }
};

export default function NewProperty() {
  const { token, apiBase } = useBroker();
  const [step, setStep] = useState(1);
  const [activeStep, setActiveStep] = useState(1); // Track which accordion section is open
  const [errors, setErrors] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [lookups, setLookups] = useState(null);

  const [basic, setBasic] = useState({
    property_for: 'sell',
    building_type: 'residential',
    property_type: 'flat',
    title: '',
    description: '',
    state: '', city: '', locality: '', sub_locality: '', society_name: '', address: ''
  });

  const [features, setFeatures] = useState({
    built_up_area: '', area_unit: 'sqft',
    carpet_area: '', carpet_area_unit: '',
    super_area: '', super_area_unit: '',
    expected_price: '', booking_amount: '', maintenance_charges: '',
    sale_type: 'new_property', no_of_floors: 1, availability: 'ready_to_move',
    possession_by: '', property_on_floor: '', furnishing_status: 'unfurnished', facing: '', flooring_type: '',
    ownership: 'freehold', rera_status: 'not_applicable', rera_number: '', age_years: '',
    num_bedrooms: '',
    num_bathrooms: '',
    num_balconies: ''
  });

  const [priceWords, setPriceWords] = useState('');
  const [priceShortText, setPriceShortText] = useState('');
  const [showCarpet, setShowCarpet] = useState(false);
  const [showSuper, setShowSuper] = useState(false);
  const [showAreaCalc, setShowAreaCalc] = useState(false);
  const [calc, setCalc] = useState({ value: '', unit: 'square feet', result: '' });
  const [showFurnishModal, setShowFurnishModal] = useState(false);
  const [furnishItems, setFurnishItems] = useState({});

  function handleExpectedPriceChange(e) {
    let v = (e.target.value || '').toString();
    v = v.replace(/[^0-9]/g, '');
    if (v.length > 12) v = v.slice(0, 12);
    setFeatures(prev => ({ ...prev, expected_price: v }));
  }
  useEffect(() => {
    // Convert number to Indian words (crore/lakh/thousand/hundred)
    function numberToIndianWords(value) {
      const num = Number(value);
      if (!Number.isFinite(num) || num <= 0) return '';
      const belowTwenty = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
      const tensNames = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
      function twoDigits(n){
        if (n < 20) return belowTwenty[n];
        const t = Math.floor(n/10); const r = n % 10;
        return tensNames[t] + (r ? ` ${belowTwenty[r]}` : '');
      }
      function threeDigits(n){
        const h = Math.floor(n/100); const r = n % 100;
        return (h ? `${belowTwenty[h]} Hundred${r? ' and ': ''}` : '') + (r ? twoDigits(r) : '');
      }
      const crore = Math.floor(num / 10000000);
      const lakh = Math.floor((num % 10000000) / 100000);
      const thousand = Math.floor((num % 100000) / 1000);
      const hundred = num % 1000;
      const parts = [];
      if (crore) parts.push(`${twoDigits(crore)} Crore`);
      if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
      if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
      if (hundred) parts.push(threeDigits(hundred));
      return parts.join(' ');
    }

    const num = Number(features.expected_price);
    const area = Number(features.built_up_area);
    
    // Set complete price in English words
    if (Number.isFinite(num) && num > 0) {
      setPriceWords(numberToIndianWords(num));
    } else {
      setPriceWords('');
    }
    
    // Calculate price per square foot
    if (Number.isFinite(num) && num > 0 && Number.isFinite(area) && area > 0) {
      const pricePerSqft = num / area;
      const unit = features.area_unit || 'Sq.ft.';
      let short = '';
      if (pricePerSqft >= 10000000) {
        short = `${(pricePerSqft / 10000000).toFixed(2)} Cr`;
      } else if (pricePerSqft >= 100000) {
        short = `${(pricePerSqft / 100000).toFixed(2)} Lac`;
      } else if (pricePerSqft >= 1000) {
        short = `${(pricePerSqft / 1000).toFixed(2)} K`;
      } else {
        short = pricePerSqft.toFixed(2);
      }
      setPriceShortText(`${short}/${unit}`);
    } else {
      setPriceShortText('');
    }
  }, [features.expected_price, features.built_up_area, features.area_unit]);

  const [highlights, setHighlights] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [nearby, setNearby] = useState([]);
  const [amenityOptions, setAmenityOptions] = useState([
    'Car Parking','Power Backup','24x7 Security','Lift','Fitness Center/ Gym','Club House','Rain Water Harvesting','Intercom','Maintenance Staff','Vastu Complaint','Security/ Fire Alarm','Piped Gas','Wifi Connectivity','Swimming Pool'
  ]);
  const [landmarkOptions, setLandmarkOptions] = useState([
    'Hospitals','School','Bank','Railway Station','ATM','Bus Stop','Airport','Shopping Mall','Metro Station'
  ]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    // Load simple static options
    setLookups({
      residential: ['flat','independent_house','builder_floor','farm_house','residential_land','penthouse','studio_apartment','villa'],
      commercial: ['commercial_shop','showroom','office_space','business_center','farm_agricultural_land','commercial_plot','industrial_land','guest_house','hotel_restaurant','warehouse_godown','factory'],
      areaUnits: ['Sq.ft.','Cent','Sq. Yards','Ares','Acre','Sq. Meter','Bigha','Hectares','Guntha','Marla','Dismil','Biswa','Katha'],
      furn: ['furnished','semi_furnished','unfurnished']
    });
  }, []);

  const propertyTypes = useMemo(() => {
    if (!lookups) return [];
    return lookups[basic.building_type] || [];
  }, [lookups, basic.building_type]);

  // Get current property type configuration
  const fieldConfig = useMemo(() => {
    return propertyFieldConfig[basic.property_type] || propertyFieldConfig.flat;
  }, [basic.property_type]);

  // Reset fields when property type changes
  useEffect(() => {
    if (!basic.property_type) return;
    const config = propertyFieldConfig[basic.property_type];
    if (!config) return;

    setFeatures(prev => {
      const reset = { ...prev };
      // Reset fields that are not shown for this property type
      if (!config.showBedrooms) reset.num_bedrooms = '';
      if (!config.showBathrooms) reset.num_bathrooms = '';
      if (!config.showBalconies) reset.num_balconies = '';
      if (!config.showFloors) reset.no_of_floors = 1;
      if (!config.showPropertyOnFloor) reset.property_on_floor = '';
      if (!config.showFurnishing) reset.furnishing_status = 'unfurnished';
      if (!config.showFacing) reset.facing = '';
      if (!config.showFlooring) reset.flooring_type = '';
      if (!config.showAge) reset.age_years = '';
      if (!config.showAdditionalRooms) reset.additional_rooms = [];
      if (!config.showPropertyTags) reset.property_tags = [];
      return reset;
    });
    setFieldErrors({});
  }, [basic.property_type]);

  function onChange(setter) {
    return (e) => {
      setter((prev) => ({ ...prev, [e.target.name]: e.target.value }));
      // Clear error for this field when user starts typing
      if (fieldErrors[e.target.name]) {
        setFieldErrors(prev => {
          const next = { ...prev };
          delete next[e.target.name];
          return next;
        });
      }
    };
  }

  // Validation function
  function validateFields() {
    const config = propertyFieldConfig[basic.property_type];
    if (!config) return { valid: true, errors: {} };

    const newErrors = {};
    const fieldLabels = {
      built_up_area: config.areaType === 'plot_land' ? 'Plot/Land Area' : 'Built Up Area',
      expected_price: 'Expected Price',
      num_bedrooms: 'No. of Bedrooms',
      sale_type: 'Sale Type',
      no_of_floors: 'Number of Floors',
      availability: 'Availability',
      property_on_floor: 'Property on the Floor',
      age_years: 'Age of Property',
      rera_status: 'RERA Registration Status',
      possession_by: 'Possession By',
      rera_number: 'RERA No.'
    };

    // Check mandatory fields
    for (const field of config.mandatory) {
      const value = features[field];
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        newErrors[field] = `${fieldLabels[field] || field} is required`;
      }
    }

    // Check conditional mandatory fields
    if (config.conditionalMandatory) {
      for (const [field, condition] of Object.entries(config.conditionalMandatory)) {
        // For age_years, also check if showAge is true in config
        if (field === 'age_years' && !config.showAge) {
          continue; // Skip validation if age field is not shown for this property type
        }
        if (condition(features)) {
          const value = features[field];
          if (value === undefined || value === null || value === '' || 
              (Array.isArray(value) && value.length === 0)) {
            newErrors[field] = `${fieldLabels[field] || field} is required`;
          }
        }
      }
    }

    setFieldErrors(newErrors);
    return { valid: Object.keys(newErrors).length === 0, errors: newErrors };
  }

  // Helper function to render label with asterisk for mandatory fields
  function FieldLabel({ name, label, config }) {
    const isMandatory = config?.mandatory?.includes(name) || 
                      (config?.conditionalMandatory?.[name] && config.conditionalMandatory[name](features));
    return (
      <label className={isMandatory ? 'np-label-required' : ''}>
        {label}
        {isMandatory && <span className="np-asterisk"> *</span>}
        {fieldErrors[name] && <span className="np-field-error">{fieldErrors[name]}</span>}
      </label>
    );
  }

  // Calculate progress for Step 1 (Property Info & Location)
  const step1Progress = useMemo(() => {
    let filled = 0;
    let total = 7; // property_for, building_type, property_type, title, state, city, locality
    if (basic.property_for) filled++;
    if (basic.building_type) filled++;
    if (basic.property_type) filled++;
    if (basic.title?.trim()) filled++;
    if (basic.state?.trim()) filled++;
    if (basic.city?.trim()) filled++;
    if (basic.locality?.trim()) filled++;
    return Math.round((filled / total) * 100);
  }, [basic]);

  // Calculate progress for Step 2 (Property Features & Price)
  const step2Progress = useMemo(() => {
    const config = propertyFieldConfig[basic.property_type] || propertyFieldConfig.flat;
    let filled = 0;
    let total = config.mandatory.length;
    
    for (const field of config.mandatory) {
      const value = features[field];
      if (value !== undefined && value !== null && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        filled++;
      }
    }
    
    // Check conditional mandatory
    if (config.conditionalMandatory) {
      for (const [field, condition] of Object.entries(config.conditionalMandatory)) {
        if (field === 'age_years' && !config.showAge) continue;
        if (condition(features)) {
          total++;
          const value = features[field];
          if (value !== undefined && value !== null && value !== '' && 
              !(Array.isArray(value) && value.length === 0)) {
            filled++;
          }
        }
      }
    }
    
    return total > 0 ? Math.round((filled / total) * 100) : 0;
  }, [features, basic.property_type]);

  // Calculate progress for Step 3 (Images/Videos)
  const step3Progress = useMemo(() => {
    let hasImages = false;
    let hasDescription = false;
    // Check if there are any images in the allImages array
    if (files?.allImages && files.allImages.length > 0) {
      hasImages = true;
    }
    if (basic.description?.trim()) hasDescription = true;
    const filled = (hasImages ? 1 : 0) + (hasDescription ? 1 : 0);
    return Math.round((filled / 2) * 100);
  }, [files, basic.description]);

  // Calculate progress for Step 4 (Amenities & Landmarks)
  const step4Progress = useMemo(() => {
    const hasAmenities = amenities.length > 0;
    const hasLandmarks = nearby.length > 0;
    const filled = (hasAmenities ? 1 : 0) + (hasLandmarks ? 1 : 0);
    return Math.round((filled / 2) * 100);
  }, [amenities, nearby]);

  // Check if Step 1 is complete (all mandatory fields filled)
  const isStep1Complete = useMemo(() => {
    return basic.property_for && 
           basic.building_type && 
           basic.property_type && 
           basic.title?.trim() && 
           basic.state?.trim() && 
           basic.city?.trim() && 
           basic.locality?.trim();
  }, [basic]);

  // Check if Step 2 is complete (all mandatory fields filled)
  const isStep2Complete = useMemo(() => {
    const config = propertyFieldConfig[basic.property_type] || propertyFieldConfig.flat;
    
    // Check all mandatory fields
    for (const field of config.mandatory) {
      const value = features[field];
      if (value === undefined || value === null || value === '' || 
          (Array.isArray(value) && value.length === 0)) {
        return false;
      }
    }
    
    // Check conditional mandatory fields
    if (config.conditionalMandatory) {
      for (const [field, condition] of Object.entries(config.conditionalMandatory)) {
        if (field === 'age_years' && !config.showAge) continue;
        if (condition(features)) {
          const value = features[field];
          if (value === undefined || value === null || value === '' || 
              (Array.isArray(value) && value.length === 0)) {
            return false;
          }
        }
      }
    }
    
    return true;
  }, [features, basic.property_type]);

  // Handle Save & Continue for Step 1
  function handleStep1Continue() {
    const missing = [];
    if (!basic.property_for) missing.push('Property For');
    if (!basic.building_type) missing.push('Building Type');
    if (!basic.property_type) missing.push('Property Type');
    if (!basic.title || basic.title.trim() === '') missing.push('Title');
    if (!basic.state || basic.state.trim() === '') missing.push('State');
    if (!basic.city || basic.city.trim() === '') missing.push('City');
    if (!basic.locality || basic.locality.trim() === '') missing.push('Locality');
    
    if (missing.length > 0) {
      setErrors(`Please fill in all required fields: ${missing.join(', ')}`);
      return;
    }
    
    setErrors('');
    setActiveStep(2);
  }

  // Handle Save & Continue for Step 2
  function handleStep2Continue() {
    const validation = validateFields();
    if (!validation.valid) {
      const errorMessages = Object.values(validation.errors);
      setErrors(`Please fill in all mandatory fields: ${errorMessages.join(', ')}`);
      return;
    }
    
    setErrors('');
    setActiveStep(3);
  }

  // Handle Save & Continue for Step 3
  function handleStep3Continue() {
    setErrors('');
    setActiveStep(4);
  }

  async function handleSubmit() {
    setErrors('');
    setFieldErrors({});
    
    // Validate basic fields
    const missing = [];
    if (!basic.title || basic.title.trim() === '') missing.push('Title');
    if (!basic.state || basic.state.trim() === '') missing.push('State');
    if (!basic.city || basic.city.trim() === '') missing.push('City');
    if (!basic.building_type) missing.push('Building Type');
    if (!basic.property_type) missing.push('Property Type');
    
    if (missing.length > 0) {
      setErrors(`Please fill in all required fields: ${missing.join(', ')}`);
      return;
    }

    // Validate property features based on property type
    const validation = validateFields();
    if (!validation.valid) {
      const errorMessages = Object.values(validation.errors);
      setErrors(`Please fill in all mandatory fields: ${errorMessages.join(', ')}`);
      return;
    }
    
    let propertyId = null;
    try {
      // Clean features - convert empty strings to null for optional fields
      const cleanedFeatures = { ...features };
      // Optional fields that can be empty
      const optionalFields = ['carpet_area', 'carpet_area_unit', 'super_area', 'super_area_unit', 
                              'num_bedrooms', 'num_bathrooms', 'num_balconies', 
                              'booking_amount', 'maintenance_charges', 'possession_by', 
                              'property_on_floor', 'furnishing_status', 'facing', 'flooring_type',
                              'age_years', 'rera_number', 'additional_rooms', 'property_tags'];
      
      for (const field of optionalFields) {
        if (cleanedFeatures[field] === '' || cleanedFeatures[field] === undefined) {
          cleanedFeatures[field] = null;
        }
      }
      
      // Single API to create property and all related data
      const payload = { basic, features: cleanedFeatures, highlights, amenities, nearby_landmarks: nearby };
      const { data: created } = await axios.post(`${apiBase}/api/properties/createproperty/full`, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      
      if (!created || !created.id) {
        throw new Error('Property creation failed: Invalid response from server');
      }
      
      propertyId = created.id;

      // Media uploads - upload all images at once with default category
      try {
        const allImages = files?.allImages || [];
        let primaryMediaId = null;
        const primaryIdx = files?.primaryIdx !== undefined ? files.primaryIdx : 0; // Default to first image
        
        // eslint-disable-next-line no-restricted-syntax
        for (const [idx, file] of allImages.entries()) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('media_type', 'image');
          // Use 'exterior' for first image, 'other' for rest
          fd.append('category', idx === 0 ? 'exterior' : 'other');
          // eslint-disable-next-line no-await-in-loop
          const { data: mediaResp } = await axios.post(`${apiBase}/api/properties/${propertyId}/media`, fd, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // Store primary media ID if this is the selected primary image
          if (idx === primaryIdx && mediaResp?.id) {
            primaryMediaId = mediaResp.id;
          }
        }
        
        // Set primary image after all uploads are complete
        if (primaryMediaId) {
          await axios.post(`${apiBase}/api/properties/setprimary/${propertyId}/${primaryMediaId}`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        // Success - all operations completed
        alert('Property created successfully');
        setStep(1);
        // Reset form
        setBasic({
          property_for: 'sell',
          building_type: 'residential',
          property_type: 'flat',
          title: '',
          description: '',
          state: '', city: '', locality: '', sub_locality: '', society_name: '', address: ''
        });
        setFeatures({
          built_up_area: '', area_unit: 'sqft',
          carpet_area: '', carpet_area_unit: '',
          super_area: '', super_area_unit: '',
          expected_price: '', booking_amount: '', maintenance_charges: '',
          sale_type: 'new_property', no_of_floors: 1, availability: 'ready_to_move',
          possession_by: '', property_on_floor: '', furnishing_status: 'unfurnished', facing: '', flooring_type: '',
          ownership: 'freehold', rera_status: 'not_applicable', rera_number: '', age_years: '',
          num_bedrooms: '', num_bathrooms: '', num_balconies: ''
        });
        setHighlights([]);
        setAmenities([]);
        setNearby([]);
        setFiles([]);
        setShowCarpet(false);
        setShowSuper(false);
      } catch (mediaErr) {
        // If media upload fails, delete the created property to maintain data integrity
        if (propertyId) {
          try {
            await axios.delete(`${apiBase}/api/properties/deleteproperty/${propertyId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (deleteErr) {
            // eslint-disable-next-line no-console
            console.error('Failed to cleanup property after media upload error:', deleteErr);
          }
        }
        throw new Error(`Media upload failed: ${mediaErr?.response?.data?.message || mediaErr?.message || 'Unknown error'}. Property creation has been rolled back.`);
      }
    } catch (err) {
      // Error in property creation or media upload
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to save property';
      setErrors(errorMsg);
      // eslint-disable-next-line no-console
      console.error('Property creation error:', err);
      
      // Ensure no partial data remains
      if (propertyId) {
        try {
          await axios.delete(`${apiBase}/api/properties/deleteproperty/${propertyId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (cleanupErr) {
          // eslint-disable-next-line no-console
          console.error('Cleanup failed:', cleanupErr);
        }
      }
    }
  }

  return (
    <div className="new-property">
      <h2 className="np-heading">Post Property</h2>
      {errors && <p className="np-error">{errors}</p>}

      {/* Step 1: Property Info & Location */}
      <AccordionSection
        title="Property Info & Location"
        isOpen={activeStep === 1}
        onToggle={() => setActiveStep(activeStep === 1 ? 0 : 1)}
        progress={step1Progress}
        progressLabel={`${step1Progress}%`}
        stepNumber={1}
      >
        <div className="np-accordion-body">
          <div className="np-location-section">
            <div className="np-section-title">Property Location:</div>
            <div className="np-field">
              <FieldLabel name="property_for" label="Property For" config={{ mandatory: ['property_for'] }} />
              <div className="np-chips">
                {[['sell','Sell'], ['rent','Rent/Lease'], ['pg','PG']].map(([val,label]) => (
                  <button type="button" key={val} className={`np-chip${basic.property_for===val?' np-chip--active':''}`} onClick={() => setBasic((p) => ({ ...p, property_for: val }))}>{label}</button>
                ))}
              </div>
            </div>
            <div className="np-field">
              <FieldLabel name="building_type" label="Building Type" config={{ mandatory: ['building_type'] }} />
              <div className="np-chips">
                <button type="button" className={`np-chip${basic.building_type==='residential'?' np-chip--active':''}`} onClick={() => setBasic((p) => ({ ...p, building_type: 'residential', property_type: 'flat' }))}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 4 }}>
                    <path d="M8 1L2 5V14H6V10H10V14H14V5L8 1Z" fill="currentColor"/>
                  </svg>
                  Residential
                </button>
                <button type="button" className={`np-chip${basic.building_type==='commercial'?' np-chip--active':''}`} onClick={() => setBasic((p) => ({ ...p, building_type: 'commercial', property_type: 'commercial_shop' }))}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 4 }}>
                    <path d="M2 2H14V14H2V2ZM4 4V12H6V4H4ZM10 4V12H12V4H10Z" fill="currentColor"/>
                  </svg>
                  Commercial
                </button>
              </div>
            </div>
            <div className="np-field">
              <FieldLabel name="property_type" label="Property Type" config={{ mandatory: ['property_type'] }} />
              <div className="np-chips">
                {propertyTypes.map((t) => (
                  <button type="button" key={t} onClick={() => setBasic((p) => ({ ...p, property_type: t }))} className={`np-chip${basic.property_type===t?' np-chip--active':''}`}>{t.replaceAll('_',' ')}</button>
                ))}
              </div>
            </div>
            <div className="np-grid-2">
              <div className="np-field-wrapper" style={{ gridColumn: '1 / span 2' }}>
                <FieldLabel name="title" label="Title" config={{ mandatory: ['title'] }} />
                <input name="title" placeholder="Title" value={basic.title} onChange={onChange(setBasic)} className={fieldErrors.title ? 'np-input-error' : ''} />
              </div>
              <div className="np-field-wrapper">
                <FieldLabel name="state" label="State" config={{ mandatory: ['state'] }} />
                <input name="state" placeholder="State" value={basic.state} onChange={onChange(setBasic)} className={fieldErrors.state ? 'np-input-error' : ''} />
              </div>
              <div className="np-field-wrapper">
                <FieldLabel name="city" label="City" config={{ mandatory: ['city'] }} />
                <input name="city" placeholder="City" value={basic.city} onChange={onChange(setBasic)} className={fieldErrors.city ? 'np-input-error' : ''} />
              </div>
              <div className="np-field-wrapper">
                <FieldLabel name="locality" label="Locality" config={{ mandatory: ['locality'] }} />
                <input name="locality" placeholder="Locality" value={basic.locality} onChange={onChange(setBasic)} className={fieldErrors.locality ? 'np-input-error' : ''} />
              </div>
              <div className="np-field-wrapper">
                <label>Building/Complex</label>
                <input name="society_name" placeholder="Building/Complex" value={basic.society_name} onChange={onChange(setBasic)} />
              </div>
              <div className="np-field-wrapper" style={{ gridColumn: '1 / span 2' }}>
                <label>Address</label>
                <input name="address" placeholder="Enter Property Address" value={basic.address} onChange={onChange(setBasic)} />
              </div>
            </div>
          </div>
          <div className="np-step-actions">
            <button type="button" className="np-btn-continue" onClick={handleStep1Continue}>
              Save & Continue →
            </button>
          </div>
        </div>
      </AccordionSection>

      {showFurnishModal && (
        <div className="np-modal-backdrop" onClick={() => setShowFurnishModal(false)}>
          <div className="np-modal" onClick={(e)=> e.stopPropagation()}>
            <div className="np-modal-header">
              <div>Furnishing Details</div>
              <button className="np-modal-close" onClick={()=> setShowFurnishModal(false)}>×</button>
            </div>
            <div className="np-modal-body" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {['Water Purifier','Fan','Fridge','Exhaust Fan','Dining Table','Geyser','Stove','Light','Curtains','Modular Kitchen','TV','Chimney','AC','Bed','Wardrobe','Sofa','Washing Machine','Microwave'].map(item => {
                const qty = furnishItems[item]?.qty || 0;
                const selected = furnishItems[item]?.selected || false;
                return (
                  <div key={item} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ color: selected ? '#ef4444' : '#111827' }}>{item}</span>
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <button className="np-small-btn" onClick={()=> setFurnishItems(prev=> ({ ...prev, [item]: { selected: true, qty: Math.max(0,(qty-1)) } }))}>−</button>
                      <span>{qty}</span>
                      <button className="np-small-btn" onClick={()=> setFurnishItems(prev=> ({ ...prev, [item]: { selected: true, qty: qty+1 } }))}>+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="np-modal-actions">
              <button className="np-btn" onClick={()=> { setFurnishItems({}); }}>Reset All</button>
              <button className="np-btn" onClick={()=> setShowFurnishModal(false)}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Property Features & Price */}
      <AccordionSection
        title="Property Features & Price"
        isOpen={activeStep === 2}
        onToggle={() => setActiveStep(activeStep === 2 ? 0 : 2)}
        progress={step2Progress}
        progressLabel={`${step2Progress}%`}
        stepNumber={2}
        canEdit={isStep1Complete}
      >
        <div className="np-accordion-body">
        <div className="np-grid-3">
          {/* Area Field - Built Up Area or Plot/Land Area */}
          <div className="np-field-wrapper" style={{ gridColumn: '1 / span 1' }}>
            <FieldLabel name="built_up_area" label={fieldConfig.areaType === 'plot_land' ? 'Plot/Land Area' : 'Built Up Area'} config={fieldConfig} />
            <input 
              name="built_up_area" 
              placeholder={fieldConfig.areaType === 'plot_land' ? 'Plot / Land Area' : 'Built Up Area'} 
              value={features.built_up_area} 
              onChange={onChange(setFeatures)}
              className={fieldErrors.built_up_area ? 'np-input-error' : ''}
            />
          </div>
          <select name="area_unit" value={features.area_unit} onChange={onChange(setFeatures)}>
            {lookups?.areaUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <div className="np-right-inline">
            <a className="np-link" onClick={(e)=>{ e.preventDefault(); setShowAreaCalc(true); }}>Area Calculator</a>
          </div>
          
          {/* Carpet Area and Super Area - only for built_up area type */}
          {fieldConfig.areaType === 'built_up' && (
            <>
              <div className="np-inline-actions" style={{ gridColumn: '1 / span 3' }}>
                <button type="button" className="np-small-btn" onClick={() => setShowCarpet(true)} disabled={showCarpet}>Add Carpet Area</button>
                <button type="button" className="np-small-btn" onClick={() => setShowSuper(true)} disabled={showSuper}>Add Super Area</button>
              </div>
              {showCarpet && (
                <>
                  <input name="carpet_area" placeholder="Carpet area" value={features.carpet_area} onChange={onChange(setFeatures)} />
                  <select name="carpet_area_unit" value={features.carpet_area_unit} onChange={onChange(setFeatures)}>
                    <option value="">Area Unit</option>
                    {lookups?.areaUnits.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <div className="np-remove-wrap"><button type="button" className="np-remove" onClick={() => { setShowCarpet(false); setFeatures(p=>({ ...p, carpet_area:'', carpet_area_unit:'' })); }}>×</button></div>
                </>
              )}
              {showSuper && (
                <>
                  <input name="super_area" placeholder="Super area" value={features.super_area} onChange={onChange(setFeatures)} />
                  <select name="super_area_unit" value={features.super_area_unit} onChange={onChange(setFeatures)}>
                    <option value="">Area Unit</option>
                    {lookups?.areaUnits.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <div className="np-remove-wrap"><button type="button" className="np-remove" onClick={() => { setShowSuper(false); setFeatures(p=>({ ...p, super_area:'', super_area_unit:'' })); }}>×</button></div>
                </>
              )}
            </>
          )}

          {/* Expected Price */}
          <div className="np-field-wrapper" style={{ gridColumn: '1 / span 1' }}>
            <FieldLabel name="expected_price" label="Expected Price" config={fieldConfig} />
            <input 
              name="expected_price" 
              placeholder="Enter Total Price" 
              value={features.expected_price} 
              onChange={handleExpectedPriceChange} 
              inputMode="numeric" 
              pattern="[0-9]*" 
              maxLength={12}
              className={fieldErrors.expected_price ? 'np-input-error' : ''}
            />
          </div>
          <input readOnly value={priceShortText} placeholder="20 Lac/Sq.ft." />
          <div className="np-hint" style={{ alignSelf: 'center', color: '#6b7280' }}>{priceWords}</div>
          
          {/* Booking Amount - show for all types */}
          <input name="booking_amount" placeholder="Booking Amount" value={features.booking_amount || ''} onChange={onChange(setFeatures)} />
          
          {/* Maintenance Charges - only for built_up area type */}
          {fieldConfig.areaType === 'built_up' && (
            <input name="maintenance_charges" placeholder="Maintenance Charges" value={features.maintenance_charges} onChange={onChange(setFeatures)} />
          )}

          {/* Bedrooms - conditional */}
          {fieldConfig.showBedrooms && (
            <div className="np-washrooms">
              <FieldLabel name="num_bedrooms" label="No. of Bedrooms" config={fieldConfig} />
              <div className="np-chips">
                {['1 RK','1','1.5','2','2.5'].map(v => (
                  <button type="button" key={v} className={`np-chip${String(features.num_bedrooms)===v?' np-chip--active':''}`} onClick={()=>setFeatures(prev=>({ ...prev, num_bedrooms: v }))}>{v}</button>
                ))}
                <select className="np-more-select" value={['3','3.5','4','4.5','5'].includes(String(features.num_bedrooms)) ? String(features.num_bedrooms) : ''} onChange={(e)=> setFeatures(prev=>({ ...prev, num_bedrooms: e.target.value }))} style={{ marginLeft: 8 }}>
                  <option value="">More</option>
                  <option value="3">3</option>
                  <option value="3.5">3.5</option>
                  <option value="4">4</option>
                  <option value="4.5">4.5</option>
                  <option value="5">5</option>
                </select>
              </div>
            </div>
          )}

          {/* Bathrooms - conditional */}
          {fieldConfig.showBathrooms && (
            <div className="np-washrooms">
              <label>No. of Bathrooms</label>
              <div className="np-chips">
                {[1,2,3,4,5,6].map(n => (
                  <button type="button" key={n} className={`np-chip${String(features.num_bathrooms)===String(n)?' np-chip--active':''}`} onClick={()=>setFeatures(prev=>({ ...prev, num_bathrooms: n }))}>{n}</button>
                ))}
                <select className="np-more-select" value={['7','8','9','10'].includes(String(features.num_bathrooms)) ? String(features.num_bathrooms) : ''} onChange={(e)=> setFeatures(prev=>({ ...prev, num_bathrooms: e.target.value }))} style={{ marginLeft: 8 }}>
                  <option value="">More</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                </select>
              </div>
            </div>
          )}

          {/* Balconies - conditional */}
          {fieldConfig.showBalconies && (
            <div className="np-washrooms">
              <label>No. of Balconies</label>
              <div className="np-chips">
                {[1,2,3,4,5,6].map(n => (
                  <button type="button" key={n} className={`np-chip${String(features.num_balconies)===String(n)?' np-chip--active':''}`} onClick={()=>setFeatures(prev=>({ ...prev, num_balconies: n }))}>{n}</button>
                ))}
                <select className="np-more-select" value={['7','8','9','10'].includes(String(features.num_balconies)) ? String(features.num_balconies) : ''} onChange={(e)=> setFeatures(prev=>({ ...prev, num_balconies: e.target.value }))} style={{ marginLeft: 8 }}>
                  <option value="">More</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Step 2b: Transaction Type, Property Availability */}
        <div className="np-subsection">
          <div className="np-subsection-title">Transaction Type, Property Availability</div>
          <div className="np-grid-3">
            {/* Sale Type - always shown */}
            <div className="np-field">
              <FieldLabel name="sale_type" label="Sale Type" config={fieldConfig} />
              <div className="np-chips">
                {[['resale','Resale Property'], ['new_property','New Property']].map(([val,label]) => (
                  <button key={val} type="button" className={`np-chip${features.sale_type===val?' np-chip--active':''}`} onClick={() => setFeatures(prev=>({ ...prev, sale_type: val }))}>{label}</button>
                ))}
              </div>
            </div>

            {/* Number of Floors - conditional */}
            {fieldConfig.showFloors && (
              <div className="np-field">
                <FieldLabel name="no_of_floors" label="Number of Floors" config={fieldConfig} />
                <div className="np-chips">
                  {[1,2,3,4,5,6].map(n => (
                    <button key={n} type="button" className={`np-chip${Number(features.no_of_floors)===n?' np-chip--active':''}`} onClick={()=> setFeatures(prev=>({ ...prev, no_of_floors: n }))}>{n}</button>
                  ))}
                  <select className="np-more-select" value={Number(features.no_of_floors) > 6 ? String(features.no_of_floors) : ''} onChange={(e)=> setFeatures(prev=>({ ...prev, no_of_floors: Number(e.target.value) }))} style={{ marginLeft: 8 }}>
                    <option value="">More</option>
                    {Array.from({ length: 20 }, (_, i) => i+7).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Availability - conditional (only for properties with floors) */}
            {fieldConfig.showFloors && (
              <div className="np-field">
                <FieldLabel name="availability" label="Availability" config={fieldConfig} />
                <div className="np-chips">
                  {['under_construction','ready_to_move','upcoming'].map(v => (
                    <button key={v} type="button" className={`np-chip${features.availability===v?' np-chip--active':''}`} onClick={() => setFeatures(prev=>({ ...prev, availability: v }))}>{v.replaceAll('_',' ')}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Possession By - conditional */}
            {fieldConfig.showFloors && features.availability !== 'ready_to_move' && (
              <div className="np-field">
                <FieldLabel name="possession_by" label="Possession By" config={fieldConfig} />
                <select 
                  name="possession_by" 
                  value={features.possession_by || ''} 
                  onChange={onChange(setFeatures)}
                  className={fieldErrors.possession_by ? 'np-input-error' : ''}
                >
                  <option value="">Expected by</option>
                  <option value="Within 3 Months">Within 3 Months</option>
                  <option value="Within 6 Months">Within 6 Months</option>
                  <option value="By 2025">By 2025</option>
                  <option value="By 2026">By 2026</option>
                  <option value="By 2027">By 2027</option>
                  <option value="By 2028">By 2028</option>
                  <option value="By 2029">By 2029</option>
                </select>
              </div>
            )}

            {/* Property on the Floor - conditional */}
            {fieldConfig.showPropertyOnFloor && (
              <div className="np-field">
                <FieldLabel name="property_on_floor" label="Property on the Floor" config={fieldConfig} />
                <div className="np-chips">
                  {['Basement','Ground','1st','2nd'].map(v => (
                    <button key={v} type="button" className={`np-chip${features.property_on_floor===v?' np-chip--active':''}`} onClick={() => setFeatures(prev=>({ ...prev, property_on_floor: v }))}>{v}</button>
                  ))}
                  <select className="np-more-select" value={features.property_on_floor?.endsWith('th') ? features.property_on_floor : ''} onChange={(e)=> setFeatures(prev=>({ ...prev, property_on_floor: e.target.value }))}>
                    <option value="">11th</option>
                    {Array.from({ length: 20 }, (_, i) => i+3).map(n => (
                      <option key={n} value={`${n}th`}>{n}th</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Furnishing Status - conditional */}
            {fieldConfig.showFurnishing && (
              <div className="np-field">
                <label>Furnishing Status</label>
                <div className="np-chips">
                  {['furnished','semi_furnished','unfurnished'].map(v => (
                    <button key={v} type="button" className={`np-chip${features.furnishing_status===v?' np-chip--active':''}`} onClick={() => { setFeatures(prev=>({ ...prev, furnishing_status: v })); if (v !== 'unfurnished') setShowFurnishModal(true); }}>{v.replaceAll('_','-')}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Facing - conditional */}
            {fieldConfig.showFacing && (
              <div className="np-field">
                <label>Facing</label>
                <select name="facing" value={features.facing || ''} onChange={onChange(setFeatures)}>
                  <option value="">Select Facing</option>
                  <option>East</option>
                  <option>South</option>
                  <option>West</option>
                  <option>North</option>
                  <option>South East</option>
                  <option>South West</option>
                  <option>North West</option>
                  <option>North East</option>
                </select>
              </div>
            )}

            {/* Type of Flooring - conditional */}
            {fieldConfig.showFlooring && (
              <div className="np-field">
                <label>Type of Flooring</label>
                <select name="flooring_type" value={features.flooring_type || ''} onChange={onChange(setFeatures)}>
                  <option value="">Select Type of Flooring</option>
                  {['Bamboo','Brick','Carpet','Concrete','Granite','Hardwood','Laminate','Linoleum','Marble','Stone','Terrazzo','Tile','vinyl'].map(x => <option key={x}>{x}</option>)}
                </select>
              </div>
            )}

            {/* Age of Property - conditional */}
            {fieldConfig.showAge && features.availability === 'ready_to_move' && (
              <div className="np-field">
                <FieldLabel name="age_years" label="Age of Property" config={fieldConfig} />
                <select 
                  name="age_years" 
                  value={features.age_years || ''} 
                  onChange={onChange(setFeatures)}
                  className={fieldErrors.age_years ? 'np-input-error' : ''}
                >
                  <option value="">Select Age of Property</option>
                  <option>Under Construction</option>
                  <option>New Construction</option>
                  <option>0 to 5 years</option>
                  <option>5 to 10 years</option>
                  <option>10 to 15 years</option>
                  <option>15 to 20 years</option>
                  <option>Above 20 years</option>
                </select>
              </div>
            )}

            {/* RERA Registration Status - always shown */}
            <div className="np-field">
              <FieldLabel name="rera_status" label="RERA Registration Status" config={fieldConfig} />
              <div className="np-chips">
                {['registered','applied','not_applicable'].map(v => (
                  <button key={v} type="button" className={`np-chip${features.rera_status===v?' np-chip--active':''}`} onClick={() => setFeatures(prev=>({ ...prev, rera_status: v }))}>{v.replaceAll('_',' ')}</button>
                ))}
              </div>
            </div>

            {/* RERA Number - conditional */}
            {features.rera_status === 'registered' && (
              <div className="np-field-wrapper">
                <FieldLabel name="rera_number" label="RERA No." config={fieldConfig} />
                <input 
                  name="rera_number" 
                  placeholder="Enter RERA No" 
                  value={features.rera_number || ''} 
                  onChange={onChange(setFeatures)}
                  className={fieldErrors.rera_number ? 'np-input-error' : ''}
                />
              </div>
            )}

            {/* Additional Rooms - conditional */}
            {fieldConfig.showAdditionalRooms && (
              <div className="np-field" style={{ gridColumn: '1 / span 3' }}>
                <label>Additional Rooms</label>
                <div className="np-chips">
                  {['Pooja Room','Study Room','Servant Room','Other Room'].map(room => (
                    <button key={room} type="button" className={`np-chip${(features.additional_rooms||[]).includes(room)?' np-chip--active':''}`} onClick={() => {
                      const list = new Set(features.additional_rooms || []);
                      if (list.has(room)) list.delete(room); else list.add(room);
                      setFeatures(prev=>({ ...prev, additional_rooms: Array.from(list) }));
                    }}>{room}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Explaining The Property - conditional */}
            {fieldConfig.showPropertyTags && (
              <div className="np-field" style={{ gridColumn: '1 / span 3' }}>
                <label>Explaining The Property</label>
                <div className="np-chips">
                  {['Reputed Builder','Well ventilated','Fully Renovated','Vastu compliant','Spacious','Ample Parking','Gated Society','Tasteful Interiors','Luxury lifestyle','Well Maintained','Plenty of Sunlight','Width of facing Road','Corner Property','Prime Location'].map(tag => (
                    <button key={tag} type="button" className={`np-chip${(features.property_tags||[]).includes(tag)?' np-chip--active':''}`} onClick={() => {
                      const list = new Set(features.property_tags || []);
                      if (list.has(tag)) list.delete(tag); else list.add(tag);
                      setFeatures(prev=>({ ...prev, property_tags: Array.from(list) }));
                    }}>{tag}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Ownership Status - always shown */}
            <div className="np-field" style={{ gridColumn: '1 / span 3' }}>
              <label>Ownership Status</label>
              <div className="np-chips">
                {['freehold','leasehold','power_of_attorney','cooperative_society'].map(v => (
                  <button key={v} type="button" className={`np-chip${features.ownership===v?' np-chip--active':''}`} onClick={() => setFeatures(prev=>({ ...prev, ownership: v }))}>{v.replaceAll('_',' ')}</button>
                ))}
              </div>
            </div>

            {/* Approving Authority - always shown */}
            <div className="np-field" style={{ gridColumn: '1 / span 3' }}>
              <label>Which authority the property is approved by?</label>
              <div className="np-chips">
                <button type="button" className={`np-chip${features.approving_authority==='Local authority'?' np-chip--active':''}`} onClick={() => setFeatures(prev=>({ ...prev, approving_authority: 'Local authority' }))}>Local authority</button>
              </div>
            </div>
          </div>
        </div>

        <div className="np-step-actions">
          <button type="button" className="np-btn-continue" onClick={handleStep2Continue}>
            Save & Continue →
          </button>
        </div>
        </div>
      </AccordionSection>

      {showAreaCalc && (
        <div className="np-modal-backdrop" onClick={() => setShowAreaCalc(false)}>
          <div className="np-modal" onClick={(e) => e.stopPropagation()}>
            <div className="np-modal-header">
              <div>Area Converter</div>
              <button className="np-modal-close" onClick={() => setShowAreaCalc(false)}>×</button>
            </div>
            <div className="np-modal-body">
              <label>Enter Area</label>
              <input value={calc.value} onChange={(e)=> setCalc(prev=>({ ...prev, value: e.target.value }))} placeholder="0" />
              <label>Select Unit</label>
              <select value={calc.unit} onChange={(e)=> setCalc(prev=>({ ...prev, unit: e.target.value }))}>
                {['square feet','sq. yards','sq. meters','ground','ares','acres','bigha','hectares','guntha','marla','dismil','cent'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
              <label>Result</label>
              <input readOnly value={calc.result} />
              <div className="np-muted">Sq. Feets</div>
            </div>
            <div className="np-modal-actions">
              <button className="np-btn" onClick={() => {
                const v = Number(calc.value);
                if (!Number.isFinite(v)) return setCalc(prev=>({ ...prev, result: '' }));
                const key = String(calc.unit || '').trim().toLowerCase();
                // Factors tuned to mimic RealEstateIndia's converter outputs (Sq. Feet per unit)
                const precise = {
                  'square feet': 1,
                  'sq. yards': 9.000000000000899,
                  'sq. meters': 10.75268817204301,
                  'ground': 2399.9999808,
                  'ares': 1076.0000000113195,
                  'acres': 43560.40063371671,
                  'bigha': 17423.999953443073,
                  'hectares': 107637.79957940744,
                  'guntha': 1088.9999999999677,
                  'marla': 5399.219942299617,
                  'dismil': 435.6,
                  'cent': 435.6,
                };
                const m = precise[key] ?? 1;
                const raw = v * m;
                const fixed = String(raw);
                setCalc(prev=>({ ...prev, result: fixed }));
              }}>Calculate</button>
              <button className="np-btn" onClick={() => {
                if (!calc.result) return;
                setFeatures(prev => ({ ...prev, built_up_area: calc.result, area_unit: 'Sq.ft.' }));
                setShowAreaCalc(false);
              }}>Apply</button>
            </div>
          </div>
        </div>
      )}


      {/* Step 3: Describe Property, Images/Videos */}
      <AccordionSection
        title="Describe Property, Images / Videos"
        isOpen={activeStep === 3}
        onToggle={() => setActiveStep(activeStep === 3 ? 0 : 3)}
        progress={step3Progress}
        progressLabel={`${step3Progress}%`}
        stepNumber={3}
        canEdit={isStep1Complete && isStep2Complete}
      >
        <div className="np-accordion-body">
        <div className="np-mt-8">
          <div className="np-media-grid">
            <label className="np-upload-card">
              <input type="file" multiple accept="image/*" style={{ display:'none' }} onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                setFiles(prev => ({ ...prev, allImages: (prev?.allImages||[]).concat(selected) }));
              }} />
              <div className="cloud">⬆</div>
              <div className="title">Add Multiple Images</div>
              <div className="subtitle">click to browse</div>
              <button type="button" className="np-upload-btn">Upload Photos Now</button>
            </label>
            {(files?.allImages||[]).map((f, idx) => (
              <div key={idx} className="np-media-card">
                <img src={URL.createObjectURL(f)} alt="preview" />
                <div className="np-media-chip">Under Screening</div>
                <div className="np-media-actions">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="radio" name="np-primary" checked={Boolean(files?.primaryIdx === idx || (idx === 0 && !files?.primaryIdx))} onChange={()=>{
                      setFiles(prev=> ({ ...prev, primaryIdx: idx }));
                    }} />
                    <span>Set as Default</span>
                  </label>
                  <button className="np-small-btn" onClick={()=>{
                    setFiles(prev=>{
                      const list = (prev?.allImages||[]).slice();
                      list.splice(idx,1);
                      // Adjust primaryIdx if needed
                      let newPrimaryIdx = prev?.primaryIdx;
                      if (newPrimaryIdx === idx) {
                        newPrimaryIdx = 0; // Reset to first image
                      } else if (newPrimaryIdx > idx) {
                        newPrimaryIdx = newPrimaryIdx - 1; // Adjust index
                      }
                      return { ...prev, allImages: list, primaryIdx: newPrimaryIdx };
                    });
                  }}>Remove</button>
                </div>
                <div style={{ fontSize: 12 }}>
                  <button className="np-small-btn" onClick={()=> window.open(URL.createObjectURL(f), '_blank')}>View/Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <textarea name="description" rows="4" placeholder="Property Descriptions" value={basic.description} onChange={onChange(setBasic)} className="np-textarea" />
        <div className="np-step-actions">
          <button type="button" className="np-btn-continue" onClick={handleStep3Continue}>
            Save & Continue →
          </button>
        </div>
        </div>
      </AccordionSection>

      {/* Step 4: Amenities & Landmarks */}
      <AccordionSection
        title="Property Amenities & Land Mark"
        isOpen={activeStep === 4}
        onToggle={() => setActiveStep(activeStep === 4 ? 0 : 4)}
        progress={step4Progress}
        progressLabel={`${step4Progress}%`}
        stepNumber={4}
        canEdit={isStep1Complete && isStep2Complete}
      >
        <div className="np-accordion-body">
        <div className="np-field">
          <label style={{ fontWeight: 600 }}>Amenities</label>
          <div className="np-chips">
            {amenityOptions.map((opt) => (
              <button type="button" key={opt} className={`np-chip${amenities.includes(opt)?' np-chip--active':''}`} onClick={() => {
                setAmenities((prev) => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
              }}>{opt}</button>
            ))}
            <button type="button" className="np-link" onClick={() => {
              const v = prompt('Add amenity');
              if (v) setAmenityOptions((prev) => prev.includes(v) ? prev : [...prev, v]);
            }}>Add More Amenities</button>
          </div>
        </div>

        <div className="np-field">
          <label style={{ fontWeight: 600 }}>Near by Land Mark</label>
          <div className="np-chips">
            {landmarkOptions.map((opt) => (
              <button type="button" key={opt} className={`np-chip${nearby.includes(opt)?' np-chip--active':''}`} onClick={() => {
                setNearby((prev) => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
              }}>{opt}</button>
            ))}
          </div>
        </div>
        <div className="np-step-actions">
          <button type="button" className="np-btn-submit" onClick={handleSubmit}>
            Submit Property
          </button>
        </div>
        </div>
      </AccordionSection>
    </div>
  );
}


