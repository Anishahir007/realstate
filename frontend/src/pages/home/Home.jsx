import React from 'react'
import Navbar from '../../components/navbar/Navbar'
import Hero from '../../components/hero/Hero'
import Citywiseproperty from '../../components/Citywiseproperty/Citywiseproperty'
import Highdemandproject from '../../components/Highdemandproject/Highdemandproject'
import Recommendedseller from '../../components/Recommendedseller/Recommendedseller'
import Sellproperty from '../../components/Sellproperty/Sellproperty'
import Footer from '../../components/footer/Footer'
import PropertyTypes from '../../components/PropertyTypes/PropertyTypes'
import RealEstateGuide from '../../components/RealEstateGuide/RealEstateGuide'
import PopularOwner from '../../components/PopularOwner/PopularOwner'
import BlogNews from '../../components/BlogNews/BlogNews'

const Home = () => {


  return (
    <>
<Navbar />
<Hero />
<Citywiseproperty />
<Highdemandproject />
<Sellproperty />
<PropertyTypes />
<RealEstateGuide />
<Recommendedseller />
<PopularOwner />
<BlogNews />
<Footer />
    </>
  )
};

export default Home;
