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
    try {
        const res = await axios.post("/booking", {
            slotId: data.slotId,
            user: localStorage.getItem("userId"),
            count: data.count,
        });
        return res.data;
    } catch (err) {
        // Surface SLOT_FULL so the UI can offer the waitlist
        if (err.response?.status === 409) {
            return { error: true, code: err.response.data.code, message: err.response.data.message };
        }
        console.log(err);
        return { error: true, message: err.response?.data?.message || "Booking failed" };
    }
}

// List bookable slots for a museum (optionally filtered by date)
export const getSlots = async (museumId, date) => {
    const res = await axios
        .get(`/museum/${museumId}/slots`, { params: date ? { date } : {} })
        .catch((err) => console.log(err));
    return res?.data?.slots || [];
}

// Join the waitlist for a full slot
export const joinWaitlist = async ({ slotId, count }) => {
    try {
        const res = await axios.post("/waitlist", {
            slotId,
            user: localStorage.getItem("userId"),
            count,
        });
        return res.data;
    } catch (err) {
        console.log(err);
        return { error: true, message: err.response?.data?.message || "Could not join waitlist" };
    }
}

// In-app notifications for the logged-in user
export const getNotifications = async () => {
    const id = localStorage.getItem("userId");
    const res = await axios.get(`/notification/user/${id}`).catch((err) => console.log(err));
    return res?.data?.notifications || [];
}

export const markNotificationRead = async (notificationId) => {
    const id = localStorage.getItem("userId");
    const res = await axios
        .patch(`/notification/user/${id}/${notificationId}/read`)
        .catch((err) => console.log(err));
    return res?.data;
}

// Fetch the signed QR ticket for a confirmed booking
export const getTicket = async (bookingId) => {
    const res = await axios.get(`/ticket/${bookingId}`).catch((err) => console.log(err));
    return res?.data;
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
            price: data.price,
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