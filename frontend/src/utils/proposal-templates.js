/**
 * Proposal Templates
 * 
 * This file contains pre-defined templates for different types of proposals.
 * Each template includes section definitions and starter content.
 */

// Helper function to create a text block
const createTextBlock = (x, y, width, height, content, sectionId) => {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    x,
    y,
    width,
    height,
    content,
    sectionId
  };
};

// Basic template for a simple proposal
export const basicTemplate = {
  title: 'Basic Proposal',
  description: 'A simple, clean proposal template for general use',
  sections: [
    { id: 'cover', name: 'Cover Page', icon: 'mdi-file-document-outline' },
    { id: 'overview', name: 'Project Overview', icon: 'mdi-information-outline' },
    { id: 'scope', name: 'Scope of Work', icon: 'mdi-clipboard-list-outline' },
    { id: 'pricing', name: 'Pricing', icon: 'mdi-currency-usd' },
    { id: 'terms', name: 'Terms & Conditions', icon: 'mdi-file-certificate-outline' }
  ],
  content: {
    cover: [
      createTextBlock(50, 50, 500, 100, {
        blocks: [
          {
            type: 'header',
            data: {
              text: 'Project Proposal',
              level: 1
            }
          }
        ]
      }, 'cover'),
      createTextBlock(50, 200, 500, 100, {
        blocks: [
          {
            type: 'paragraph',
            data: {
              text: 'Prepared for: [Client Name]'
            }
          },
          {
            type: 'paragraph',
            data: {
              text: 'Prepared by: [Your Company]'
            }
          },
          {
            type: 'paragraph',
            data: {
              text: 'Date: [Current Date]'
            }
          }
        ]
      }, 'cover')
    ],
    overview: [
      createTextBlock(50, 50, 700, 150, {
        blocks: [
          {
            type: 'header',
            data: {
              text: 'Project Overview',
              level: 2
            }
          },
          {
            type: 'paragraph',
            data: {
              text: 'This section provides a high-level overview of the project, including the problem statement and proposed solution.'
            }
          }
        ]
      }, 'overview')
    ],
    scope: [
      createTextBlock(50, 50, 700, 300, {
        blocks: [
          {
            type: 'header',
            data: {
              text: 'Scope of Work',
              level: 2
            }
          },
          {
            type: 'paragraph',
            data: {
              text: 'This section outlines the specific deliverables and services that will be provided as part of this project.'
            }
          },
          {
            type: 'list',
            data: {
              style: 'unordered',
              items: [
                'Deliverable 1',
                'Deliverable 2',
                'Deliverable 3'
              ]
            }
          }
        ]
      }, 'scope')
    ],
    pricing: [
      createTextBlock(50, 50, 700, 300, {
        blocks: [
          {
            type: 'header',
            data: {
              text: 'Pricing',
              level: 2
            }
          },
          {
            type: 'paragraph',
            data: {
              text: 'This section outlines the cost structure for the project.'
            }
          },
          {
            type: 'table',
            data: {
              content: [
                ['Item', 'Description', 'Cost'],
                ['Item 1', 'Description of item 1', '$X,XXX'],
                ['Item 2', 'Description of item 2', '$X,XXX'],
                ['Total', '', '$XX,XXX']
              ]
            }
          }
        ]
      }, 'pricing')
    ],
    terms: [
      createTextBlock(50, 50, 700, 400, {
        blocks: [
          {
            type: 'header',
            data: {
              text: 'Terms & Conditions',
              level: 2
            }
          },
          {
            type: 'paragraph',
            data: {
              text: 'This section outlines the terms and conditions of the proposal.'
            }
          },
          {
            type: 'paragraph',
            data: {
              text: '1. Payment Terms: [Your payment terms]'
            }
          },
          {
            type: 'paragraph',
            data: {
              text: '2. Timeline: [Your timeline]'
            }
          },
          {
            type: 'paragraph',
            data: {
              text: '3. Revisions: [Your revision policy]'
            }
          },
          {
            type: 'paragraph',
            data: {
              text: '4. Cancellation: [Your cancellation policy]'
            }
          }
        ]
      }, 'terms')
    ]
  }
};

// Consulting proposal template
export const consultingTemplate = {
  title: 'Consulting Proposal',
  description: 'A comprehensive template for consulting services',
  sections: [
    { id: 'cover', name: 'Cover Page', icon: 'mdi-file-document-outline' },
    { id: 'executive', name: 'Executive Summary', icon: 'mdi-text-box-outline' },
    { id: 'background', name: 'Background', icon: 'mdi-information-outline' },
    { id: 'approach', name: 'Approach', icon: 'mdi-lightbulb-outline' },
    { id: 'deliverables', name: 'Deliverables', icon: 'mdi-package-variant-closed' },
    { id: 'timeline', name: 'Timeline', icon: 'mdi-calendar-clock' },
    { id: 'team', name: 'Team', icon: 'mdi-account-group' },
    { id: 'pricing', name: 'Pricing', icon: 'mdi-currency-usd' },
    { id: 'terms', name: 'Terms & Conditions', icon: 'mdi-file-certificate-outline' }
  ],
  content: {
    // Similar structure to basicTemplate but with consulting-specific content
    cover: [
      createTextBlock(50, 50, 500, 100, {
        blocks: [
          {
            type: 'header',
            data: {
              text: 'Consulting Proposal',
              level: 1
            }
          }
        ]
      }, 'cover'),
      createTextBlock(50, 200, 500, 100, {
        blocks: [
          {
            type: 'paragraph',
            data: {
              text: 'Prepared for: [Client Name]'
            }
          },
          {
            type: 'paragraph',
            data: {
              text: 'Prepared by: [Your Consulting Firm]'
            }
          },
          {
            type: 'paragraph',
            data: {
              text: 'Date: [Current Date]'
            }
          }
        ]
      }, 'cover')
    ],
    // Add other sections with appropriate starter content
  }
};

// Web development proposal template
export const webDevelopmentTemplate = {
  title: 'Web Development Proposal',
  description: 'A template for web development projects',
  sections: [
    { id: 'cover', name: 'Cover Page', icon: 'mdi-file-document-outline' },
    { id: 'overview', name: 'Project Overview', icon: 'mdi-information-outline' },
    { id: 'requirements', name: 'Requirements', icon: 'mdi-clipboard-list-outline' },
    { id: 'solution', name: 'Proposed Solution', icon: 'mdi-lightbulb-outline' },
    { id: 'technologies', name: 'Technologies', icon: 'mdi-code-tags' },
    { id: 'timeline', name: 'Timeline', icon: 'mdi-calendar-clock' },
    { id: 'pricing', name: 'Pricing', icon: 'mdi-currency-usd' },
    { id: 'maintenance', name: 'Maintenance & Support', icon: 'mdi-wrench' },
    { id: 'terms', name: 'Terms & Conditions', icon: 'mdi-file-certificate-outline' }
  ],
  content: {
    // Web development specific content
  }
};

// List of all available templates
export const templates = [
  basicTemplate,
  consultingTemplate,
  webDevelopmentTemplate
];

// Function to get a template by name
export const getTemplateByName = (name) => {
  return templates.find(template => template.title === name) || basicTemplate;
};

// Function to get all template names
export const getTemplateNames = () => {
  return templates.map(template => ({
    title: template.title,
    description: template.description
  }));
};
