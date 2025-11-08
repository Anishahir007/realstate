import React from 'react';
import './UltimateCRMSection.css';

const UltimateCRMSection = () => {
  const features = [
    {
      title: 'Auto Lead Capture',
      backgroundColor: '#f3e5f5',
      image: '/assets/images/crm/Real-Estate_funnel_images.png',
      imagePosition: 'right',
      features: [
        'Automatically capture leads from all sources without any manual efforts',
        'Magicbricks, 99acres, Housing, Nobroker, Google, FB, Email, Websites, Landing Pages, Social Sites, Lead Portals & 30+ sources',
        'Upload bulk leads in excel in one click',
      ],
      testimonial: {
        quote: "We get leads from 14 sources and Cretio leads simplified my life by integrating every lead in real time with source tracking",
        author: 'Rishi Patel, Sherna Properties',
        position: 'right',
      },
    },
    {
      title: 'Automatic Lead Distribution',
      backgroundColor: '#fff9c4',
      image: '/assets/images/crm/Real-Estate-Lead-Distribution-new.png',
      imagePosition: 'left',
      features: [
        'Automatically distribute leads based on your business rules',
        'Create distribution based on source, location, property type, budget or round robin',
      ],
      testimonial: {
        quote: "We have a 50 member team across India and Cretio not only distributes leads based on our business requirements but also gives reports on the time taken for first response",
        author: 'Radhika Sharma, Qubic properties',
        position: 'left',
      },
    },
    {
      title: 'Sim Based Call Management',
      backgroundColor: '#e0f2f1',
      image: '/assets/images/crm/Call_tracking-And-recording-3.png',
      imagePosition: 'right',
      features: [
        'Make calls to your Leads and Customers effortlessly using the built-in phone dialer.',
        'Easily update call status, add notes, and schedule sales follow-ups in clicks.',
        'Keep all your incoming, outgoing, and missed sales calls synchronised with your CRM.',
      ],
      testimonial: {
        quote: "Call recording helped us to fix training gaps and improve conversions. It is like a CCTV camera that helps monitoring.",
        author: 'Ravi Mehta, FashionFiesta Apparels',
        position: 'left',
      },
    },
    {
      title: 'Real-Time Call Tracking',
      backgroundColor: '#fff9c4',
      image: '/assets/images/crm/Call-Tracking-1.png',
      imagePosition: 'left',
      features: [
        'Monitor real-time sales call activity for all team members, including Incoming, Outgoing, Missed, Rejected, and Unique calls.',
        'Track your sales team productivity, including Dialled Calls, Connected Calls, Call Durations, and Total Worked Hours.',
      ],
      testimonial: {
        quote: "Automation + Manual follow-up with chatbot saved time and boosted our conversions",
        author: 'Rajesh Gupta, Globex Initech',
        position: 'right',
      },
    },
    {
      title: 'Official WhatsApp Campaigns',
      backgroundColor: '#f3e5f5',
      image: '/assets/images/crm/Real_Estate_Campaign-new-1.png',
      imagePosition: 'right',
      features: [
        'Send offers, discount coupons, and festive greetings without risking number blocking.',
        'Create engaging messages with call-to-action buttons, easy reply options, and multimedia content like images, videos, and PDFs.',
      ],
      testimonial: {
        quote: "WhatsApp works excellent for us and talking to customers in WhatsApp within the CRM system was huge gamechanger for us",
        author: 'Rakesh Sharma, 5 Elements Realty',
        position: 'left',
      },
    },
    {
      title: 'WhatsApp Drip Campaigns',
      backgroundColor: '#e0f2f1',
      image: '/assets/images/crm/Automated-WhatsApp-Drip-Campaigns-latest.png',
      imagePosition: 'left',
      features: [
        'Create and send automated follow-up messages to your leads over some time till sales closure.',
        'Customize unique offers for individual customers or prospects to boost conversion rates.',
      ],
      testimonial: {
        quote: "Automated WhatsApp follow-ups boosted our sales by 30%",
        author: 'Vrushali, Holistic Nature Homes',
        position: 'right',
      },
    },
    {
      title: 'CRM Customization & Administration',
      backgroundColor: '#fff9c4',
      image: '/assets/images/crm/Customation-image-1-latest.png',
      imagePosition: 'right',
      features: [
        'No-Code App Builder - Customize your complete sales journeys with our user-friendly drag-and-drop app builder.',
        'Role, Profile & Data Access Control - Show your sales team and managers only what\'s relevant to them.',
        'Sales Alerts & Reminders - Schedule tasks and reminders to ensure no follow-up opportunity is missed.',
      ],
      testimonial: {
        quote: "Customizing the CRM to match our internal processes is incredibly simple with Cretio.",
        author: 'Aditya Singh, TechNova Solutions',
        position: 'left',
      },
    },
  ];

  return (
    <section
      className="ultimate-crm-section"
      data-aos="fade-up"
      style={{
        boxSizing: 'border-box',
        paddingTop: 'clamp(30px, 4vw, 60px)',
        paddingBottom: 'clamp(20px, 3vw, 40px)',
        backgroundColor: '#fff',
        width: '100%',
      }}
    >
      <div
        className="ultimate-crm-container"
        style={{
          boxSizing: 'border-box',
          margin: 'auto',
          maxWidth: '1240px',
          paddingLeft: 'clamp(15px, 3vw, 30px)',
          paddingRight: 'clamp(15px, 3vw, 30px)',
          width: '100%',
        }}
      >
        {/* Main Title */}
        <div
          className="ultimate-crm-title-section"
          style={{
            boxSizing: 'border-box',
            textAlign: 'center',
            marginBottom: 'clamp(20px, 3vw, 40px)',
            width: '100%',
          }}
        >
          <h1
            className="ultimate-crm-main-heading"
            style={{
              boxSizing: 'border-box',
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 700,
              color: '#000',
              margin: 0,
              marginBottom: 'clamp(10px, 1.5vw, 20px)',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            The Ultimate Real Estate CRM
          </h1>
          <p
            className="ultimate-crm-subheading"
            style={{
              boxSizing: 'border-box',
              fontSize: 'clamp(15px, 2vw, 20px)',
              fontWeight: 400,
              color: '#666',
              margin: 0,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            All in One Sales CRM + Call Tracking App + WhatsApp Marketing.
          </p>
        </div>

        {/* Feature Sections */}
        {features.map((feature, index) => (
          <div
            key={index}
            className="ultimate-crm-feature-card"
            data-aos={index % 2 === 0 ? "fade-right" : "fade-left"}
            data-aos-delay={index * 100}
            style={{
              boxSizing: 'border-box',
              backgroundColor: feature.backgroundColor,
              borderRadius: 'clamp(12px, 2vw, 24px)',
              padding: 'clamp(20px, 4vw, 50px)',
              marginBottom: 'clamp(20px, 4vw, 40px)',
              position: 'relative',
              width: '100%',
            }}
          >
            <div
              className={`ultimate-crm-feature-grid ${feature.imagePosition === 'left' ? 'image-left' : 'image-right'}`}
              style={{
                boxSizing: 'border-box',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'clamp(20px, 4vw, 50px)',
                alignItems: 'center',
                width: '100%',
              }}
            >
              {/* Content Column */}
              <div
                className="ultimate-crm-feature-content"
                style={{
                  boxSizing: 'border-box',
                  order: feature.imagePosition === 'left' ? 2 : 1,
                  width: '100%',
                }}
              >
                {/* Feature Title */}
                <h2
                  className="ultimate-crm-feature-title"
                  style={{
                    boxSizing: 'border-box',
                    fontSize: 'clamp(24px, 3vw, 36px)',
                    fontWeight: 700,
                    color: '#000',
                    margin: 0,
                    marginBottom: 'clamp(20px, 3vw, 30px)',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {feature.title}
                </h2>

                {/* Features List */}
                <div
                  className="ultimate-crm-features-list"
                  style={{
                    boxSizing: 'border-box',
                    marginBottom: 'clamp(15px, 3vw, 30px)',
                  }}
                >
                  {feature.features.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className="ultimate-crm-feature-list-item"
                      style={{
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'flex-start',
                        marginBottom: 'clamp(10px, 1.5vw, 18px)',
                      }}
                    >
                      <i
                        className="fas fa-check-circle"
                        style={{
                          boxSizing: 'border-box',
                          fontSize: 'clamp(16px, 2vw, 22px)',
                          color: '#4caf50',
                          marginRight: 'clamp(10px, 1.5vw, 18px)',
                          flexShrink: 0,
                          marginTop: '3px',
                        }}
                      />
                      <p
                        className="ultimate-crm-feature-item"
                        style={{
                          boxSizing: 'border-box',
                          fontSize: 'clamp(15px, 1.5vw, 18px)',
                          fontWeight: 400,
                          color: '#000',
                          margin: 0,
                          lineHeight: 1.6,
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {item}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Testimonial */}
                <div
                  className="ultimate-crm-testimonial-box"
                  style={{
                    boxSizing: 'border-box',
                    backgroundColor: '#fff',
                    borderRadius: 'clamp(8px, 1.5vw, 18px)',
                    padding: 'clamp(15px, 2.5vw, 30px)',
                    marginTop: 'clamp(15px, 3vw, 30px)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    width: '100%',
                  }}
                >
                  <p
                    className="ultimate-crm-testimonial-quote"
                    style={{
                      boxSizing: 'border-box',
                      fontSize: 'clamp(14px, 1.3vw, 16px)',
                      fontWeight: 400,
                      color: '#333',
                      margin: 0,
                      marginBottom: 'clamp(12px, 1.5vw, 18px)',
                      lineHeight: 1.6,
                      fontStyle: 'italic',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    "{feature.testimonial.quote}"
                  </p>
                  <p
                    className="ultimate-crm-testimonial-author"
                    style={{
                      boxSizing: 'border-box',
                      fontSize: 'clamp(13px, 1.2vw, 15px)',
                      fontWeight: 600,
                      color: '#000',
                      margin: 0,
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    — {feature.testimonial.author}
                  </p>
                </div>
              </div>

              {/* Image Column */}
              <div
                className="ultimate-crm-feature-image"
                style={{
                  boxSizing: 'border-box',
                  order: feature.imagePosition === 'left' ? 1 : 2,
                  width: '100%',
                }}
              >
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="ultimate-crm-feature-img"
                  style={{
                    boxSizing: 'border-box',
                    width: '100%',
                    height: 'auto',
                    borderRadius: 'clamp(8px, 1.5vw, 18px)',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default UltimateCRMSection;

