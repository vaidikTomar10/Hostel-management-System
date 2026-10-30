import { CategoryMeta } from '../types';

export const COMPLAINT_CATEGORIES: CategoryMeta[] = [
  {
    id: 'electrical',
    label: 'Electrician',
    iconName: 'Zap',
    description: 'Ceiling fans, light tubes, switchboards, wiring, geyser',
    commonIssues: [
      'Ceiling fan not spinning or making sparks',
      'Tube light / bulb fused or flickering',
      'Power socket switch not supplying current',
      'Geyser / water heater not turning on',
      'Main trip switch triggered in room',
    ],
  },
  {
    id: 'plumbing',
    label: 'Plumber',
    iconName: 'Wrench',
    description: 'Taps, washbasin leaks, shower heads, flush tanks',
    commonIssues: [
      'Washroom tap continuously dripping / leaking',
      'Drainage clogged in shower area',
      'Toilet flush cistern broken or overflowing',
      'Extremely low water pressure in washbasin',
      'Hot water tap jammed',
    ],
  },
  {
    id: 'carpentry',
    label: 'Carpenter',
    iconName: 'Hammer',
    description: 'Doors, window latches, study tables, bed frames, almirah',
    commonIssues: [
      'Door lock stuck or key mechanism jammed',
      'Cupboard / Almirah door hinge detached',
      'Window glass frame loose or latch missing',
      'Bed frame ply broken or sagging',
      'Study chair wheel or armrest broken',
    ],
  },
  {
    id: 'internet',
    label: 'Wi-Fi & Network',
    iconName: 'Wifi',
    description: 'LAN port issues, router disconnects, slow hostel intranet',
    commonIssues: [
      'Room LAN port physically damaged or no signal',
      'Hostel Wi-Fi not authenticating with student ID',
      'Frequent disconnections during study hours',
      'Extremely high latency / packet drops',
    ],
  },
  {
    id: 'civil',
    label: 'Civil & Masonry',
    iconName: 'Building2',
    description: 'Wall dampness, ceiling paint peel, loose bathroom tiles',
    commonIssues: [
      'Water seepage on ceiling from upper floor',
      'Balcony railing loose or wobbling',
      'Bathroom floor tile cracked / sharp edge',
    ],
  },
  {
    id: 'other',
    label: 'General / Other',
    iconName: 'HelpCircle',
    description: 'Noise complaints, laundry issues, misplaced keys, other',
    commonIssues: [
      'Hostel laundry token machine error',
      'Common room light left turned on overnight',
      'General query for hostel warden',
    ],
  },
];

export const HOSTEL_FLOORS = [
  'Floor 0',
  'Floor 1',
  'Floor 2',
  'Floor 3',
];

export const HOSTEL_BLOCKS = HOSTEL_FLOORS;
