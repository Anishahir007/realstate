import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useBroker } from '../../../context/BrokerContext.jsx';
import './newProperty.css';

function Section({ title, children }) {
  return (
    <div className="np-section">
      <div className="np-title">{title}</div>
      {children}
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
    mandatory: ['built_up_area', 'expected_price', 'num_bedrooms', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
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
    mandatory: ['built_up_area', 'expected_price', 'num_bedrooms', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
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
    mandatory: ['built_up_area', 'expected_price', 'num_bedrooms', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
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
    mandatory: ['built_up_area', 'expected_price', 'num_bedrooms', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
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
    mandatory: ['built_up_area', 'expected_price', 'num_bedrooms', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
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
    mandatory: ['built_up_area', 'expected_price', 'num_bedrooms', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
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
    showPropertyOnFloor: true,
    showFurnishing: true,
    showFacing: true,
    showFlooring: true,
    showAge: true,
    showAdditionalRooms: true,
    showPropertyTags: true,
    mandatory: ['built_up_area', 'expected_price', 'num_bedrooms', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
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
    mandatory: ['built_up_area', 'expected_price', 'num_bedrooms', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
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
    mandatory: ['built_up_area', 'expected_price', 'num_bedrooms', 'sale_type', 'no_of_floors', 'availability', 'property_on_floor', 'rera_status'],
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
    if (Number.isFinite(num) && num > 0) {
      const unit = features.area_unit || 'Sq.ft.';
      const short = num >= 10000000
        ? `${(num / 10000000).toFixed(2)} Cr`
        : `${(num / 100000).toFixed(2)} Lac`;
      setPriceShortText(`${short}/${unit}`);
      setPriceWords(numberToIndianWords(num));
    } else {
      setPriceShortText('');
      setPriceWords('');
    }
  }, [features.expected_price, features.area_unit]);

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
    
    try {
      // Single API to create property and all related data
      const payload = { basic, features, highlights, amenities, nearby_landmarks: nearby };
      const { data: created } = await axios.post(`${apiBase}/api/properties/createproperty/full`, payload, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const id = created.id;

      // 4) media uploads per tab
      const tabs = ['exterior','bedroom','bathroom','kitchen','floor_plan','location_map','other'];
      for (const tab of tabs) {
        const arr = files?.[tab] || [];
        // eslint-disable-next-line no-restricted-syntax
        for (const [idx, file] of arr.entries()) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('media_type', 'image');
          fd.append('category', tab);
          // eslint-disable-next-line no-await-in-loop
          const { data: mediaResp } = await axios.post(`${apiBase}/api/properties/${id}/media`, fd, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // set primary if selected locally
          if (files?.primary && files.primary.tab === tab && files.primary.idx === idx && mediaResp?.id) {
            // eslint-disable-next-line no-await-in-loop
            await axios.post(`${apiBase}/api/properties/setprimary/${id}/${mediaResp.id}`, {}, {
              headers: { Authorization: `Bearer ${token}` },
            });
          }
        }
      }
      if (files?.youtube_url) {
        await axios.post(`${apiBase}/api/properties/${id}/video`, { url: files.youtube_url, category: 'video' }, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
      }

      alert('Property created');
      setStep(1);
    } catch (err) {
      setErrors(err?.response?.data?.message || err?.message || 'Failed to save');
    }
  }

  return (
    <div className="new-property">
      <h2 className="np-heading">Post Property</h2>
      {errors && <p className="np-error">{errors}</p>}

      {/* Step 1: Property Info & Location */}
      <Section title={`Step 1: Property Info & Location`}>
        <div className="np-field">
          <label>Property For</label>
          <div className="np-radio-row">
            <label><input type="radio" name="property_for" value="sell" checked={basic.property_for==='sell'} onChange={onChange(setBasic)} /> Sell</label>
          </div>
        </div>
        <div className="np-field">
          <label>Building Type</label>
          <div className="np-radio-row">
            <label><input type="radio" name="building_type" value="residential" checked={basic.building_type==='residential'} onChange={onChange(setBasic)} /> Residential</label>
            <label className="np-radio-gap"><input type="radio" name="building_type" value="commercial" checked={basic.building_type==='commercial'} onChange={onChange(setBasic)} /> Commercial</label>
          </div>
        </div>
        <div className="np-field">
          <label>Property Type</label>
          <div className="np-chips">
            {propertyTypes.map((t) => (
              <button type="button" key={t} onClick={() => setBasic((p) => ({ ...p, property_type: t }))} className={`np-chip${basic.property_type===t?' np-chip--active':''}`}>{t.replaceAll('_',' ')}</button>
            ))}
          </div>
        </div>
        <div className="np-grid-2">
          <input name="title" placeholder="Title" value={basic.title} onChange={onChange(setBasic)} />
          <input name="state" placeholder="State" value={basic.state} onChange={onChange(setBasic)} />
          <input name="city" placeholder="City" value={basic.city} onChange={onChange(setBasic)} />
          <input name="locality" placeholder="Locality" value={basic.locality} onChange={onChange(setBasic)} />
          <input name="sub_locality" placeholder="Sub Locality" value={basic.sub_locality} onChange={onChange(setBasic)} />
          <input name="society_name" placeholder="Society/Apartment" value={basic.society_name} onChange={onChange(setBasic)} />
        </div>
        <textarea name="address" rows="3" placeholder="Address" value={basic.address} onChange={onChange(setBasic)} className="np-textarea" />
      </Section>

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
      <Section title="Step 2: Property Features & Price">
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
      </Section>

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

      {/* Availability & Property Details (dependent on availability) */}
      <Section title="Step 2: Transaction Type, Property Availability">
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
              {['BDA','BMRDA','MUDA'].map(a => (
                <button key={a} type="button" className={`np-chip${features.approving_authority===a?' np-chip--active':''}`} onClick={() => setFeatures(prev=>({ ...prev, approving_authority: a }))}>{a}</button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Step 3: Describe Property, Images/Videos */}
      <Section title="Step 3: Describe Property, Images/Videos">
        <div className="np-tabs">
          {['exterior','bedroom','bathroom','kitchen','floor_plan','location_map','other'].map(tab => (
            <button key={tab} type="button" className={`np-chip${(files.activeTab||'exterior')===tab?' np-chip--active':''}`} onClick={() => setFiles(prev => ({ ...prev, activeTab: tab }))}>{tab.replaceAll('_',' ')}</button>
          ))}
          <button type="button" className={`np-chip${(files.activeTab||'')==='video'?' np-chip--active':''}`} onClick={() => setFiles(prev => ({ ...prev, activeTab: 'video' }))}>video</button>
        </div>
        { (files.activeTab||'exterior') !== 'video' ? (
          <div className="np-mt-8">
            <div className="np-media-grid">
              <label className="np-upload-card">
                <input type="file" multiple accept="image/*" style={{ display:'none' }} onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  const tab = (files.activeTab || 'exterior');
                  setFiles(prev => ({ ...prev, [tab]: (prev?.[tab]||[]).concat(selected) }));
                }} />
                <div className="cloud">⬆</div>
                <div className="title">Add Multiple Images</div>
                <div className="subtitle">click to browse</div>
                <button type="button" className="np-upload-btn">Upload Photos Now</button>
              </label>
              {(files?.[(files.activeTab||'exterior')]||[]).map((f, idx) => (
                <div key={idx} className="np-media-card">
                  <img src={URL.createObjectURL(f)} alt="preview" />
                  <div className="np-media-chip">Under Screening</div>
                  <div className="np-media-actions">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="radio" name="np-primary" checked={Boolean(files?.primary && files.primary.tab === (files.activeTab || 'exterior') && files.primary.idx === idx)} onChange={()=>{
                        const tab = files.activeTab || 'exterior';
                        setFiles(prev=> ({ ...prev, primary: { tab, idx } }));
                      }} />
                      <span>Set as Default</span>
                    </label>
                    <button className="np-small-btn" onClick={()=>{
                      const tab = files.activeTab || 'exterior';
                      setFiles(prev=>{
                        const list = (prev?.[tab]||[]).slice();
                        list.splice(idx,1);
                        return { ...prev, [tab]: list };
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
        ) : (
          <div className="np-grid-3 np-mt-8">
            <input name="youtube_url" placeholder="Enter YouTube Video URL or ID" value={files.youtube_url || ''} onChange={(e)=> setFiles(prev=> ({ ...prev, youtube_url: e.target.value }))} />
            <div className="np-muted">Example: https://youtu.be/Nt27xdVgifk</div>
          </div>
        )}
        <textarea name="description" rows="4" placeholder="Property Descriptions" value={basic.description} onChange={onChange(setBasic)} className="np-textarea" />
      </Section>

      {/* Step 4: Amenities & Landmarks */}
      <Section title="Step 4: Property Amenities & Land Mark">
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
      </Section>

      <div className="np-actions">
        <button className="np-btn" onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
}


