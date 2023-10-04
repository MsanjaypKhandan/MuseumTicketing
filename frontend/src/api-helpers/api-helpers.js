import axios from "axios";

export const getAllMuseums = async (site) =>{
    const res = await axios.get("/museum",{
        params: {
        Site: site,
        },
    }).catch((err) => console.log(err));

    if(res.status !== 200){
        return console.log("No Data");
    }

    const data = await res.data;
    return data;
}

export const sendUserAuthRequest = async (data,signup) => {
    const res = await axios
    .post(`/user/${signup ? "signup" : "login"}`,{
        name:signup ? data.name : "",
        email: data.email,
        password:data.password,
    })
    .catch((err)=>alert(err.response.data.message));

   if(res.status !== 200 && res.status !== 201){
    console.log("Error occured");
   }
   const resData = await res.data;
   return resData;
};

export const sendAdminAuthRequest = async (data) => {
    const res = await axios
    .post("/admin/login",{
        email:data.email,
        password:data.password
    })
    .catch((err)=>console.log(err));
    
    if(res.status !== 200 && res.status !== 201){
        console.log("Error occured");
       }
       const resData = await res.data;
       return resData;
    
}

export const getMuseumDetails = async (id) => {
    const res =await axios.get(`/museum/${id}`).catch((err) => console.log(err));
    if(res.status !== 200){
        return console.log("Error");
    }
    const resData = await res.data;
    return resData;
}

export const newBooking = async(data) => {
    const res = await axios.post("/booking",{
        museum : data.museum,
        date:data.date,
        user: localStorage.getItem("userId"),
        count:data.count,
    })
    .catch((err) => console.log(err));
    if(res.status !== 201){
        return console.log("Error");
    }
    const resData = await res.data
    return resData;
}

export const getUserBooking = async () => {
    const id = localStorage.getItem("userId");
    const res = await axios.get(`/user/bookings/${id}`)
    .catch((err) => console.log(err));

    if(res.status!==200){
        return console.log("Error");
    }
  
    const resData = await res.data;
    return resData;
}

export const getUserDetails = async () => {
    const id = localStorage.getItem("userId");
    const res = await axios.get(`/user/${id}`).catch((err) => console.log(err));
    if(res.status !== 200){
        return console.log("Error");
    }
    const resData = await res.data;
    return resData;
}

export const deleteBooking = async (id) => {
  const res = await axios
  .delete(`/booking/${id}`)
  .catch((err) => console.log(err));
   
  if(res.status !== 201){
    return console.log("Error");
  }
  const resData = await res.data;
  return resData;
}

 export const addMuseum = async(data) => {
     console.log(data.posterUrl);
    const res = axios.post("/museum",{
        title: data.name,
        description : data.description,
        posterUrl : data.posterUrl,
        location : data.location,
        price : data.price,
        site : data.site,
        admin : localStorage.getItem("adminId"),
        

    },
    {
        headers : {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    }).catch((err) => console.log(err));
    
    if(res.status !== 200  ){
        return console.log(res);
    }

    const resData  = await res.data;
    return resData;
 };

 export const getadminById = async() => {
    const adminId = localStorage.getItem("adminId");
    const res = await axios
    .get(`/admin/${adminId}`)
    .catch((err) => console.log(err));

    if(res.status !== 200){
        return console.log("Error");
    }

    const resData  = await res.data;
    return resData; 
 }

 export const deleteMuseum = async (id) => {
    const res = await axios
    .delete(`/museum/${id}`)
    .catch((err) => console.log(err));
     
    if(res.status !== 201){
      return console.log("Error");
    }
    const resData = await res.data;
    return resData;
  }

  export const sendEmail = async (data) => {
    const res = await axios.post(`/sendEmail`,
        {
            date:data.date,
            user: localStorage.getItem("userId"),
            count:data.count,
            bookingId : data.bookingID,
            museum:data.museum,
        },
        {
        headers : {
            Accept:"application/json",
            "content-Type": "application/json",
        },
    })
    .then((res) => {
        console.log(res);
        return res;
    })
    return res
  }

  export const updateMuseum = async (data) => {
     console.log(data)
     const id = data.museumId;
     const res = await axios.put(`/museum/${id}`,{
        title: data.name,
        description : data.description,
        posterUrl : data.posterUrl,
        location : data.location,
        price : data.price,
        admin : localStorage.getItem("adminId"),
        

    },
    {
        headers : {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    }).catch((err) => console.log(err));
          if (res.status === 200) {
            console.log('Museum updated successfully:', res.data.museum);
            // Handle success, e.g., redirect or update local state
          } else {
            console.log('Update failed:', res);
            // Handle failure, show error message, etc.
          }
       
    
  }