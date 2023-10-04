import React from 'react'
import { useState } from 'react'
import CloseIcon from '@mui/icons-material/Close';
import {Box,Dialog, Typography,FormLabel,TextField,Button, IconButton} from "@mui/material";
import { useNavigate } from 'react-router-dom';
const lableStyle = {mt: 1,mb: 1};
const Authform = ({onsubmit,isadmin}) => {
  const naviagate = useNavigate();
    const [isSignup,setisSignup] = useState(false);
    const [inputs, setInputs]=useState({
        name : "",
        email:"",
        password:"",
    })
    const handleChange = (e) => {
        setInputs((prev)=>({
            ...prev,
            [e.target.name]:e.target.value,
        }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
       onsubmit({inputs,signup: isadmin ? false : isSignup});
       if(isSignup){
        naviagate("/auth")
       }
    }
  return (
    <div>
        
      <Dialog PaperProps={{ style: {borderRadius:20}}} open={true}>
        <Box sx={{ml:"auto", padding:1}}>
            <IconButton onClick={() => naviagate('/')}>
                <CloseIcon></CloseIcon>
            </IconButton>

        </Box>
        <Typography variant='h4' textAlign={'center'}>
        {isSignup ?  "Signup" : "Login"} 
        </Typography>
        <form onSubmit={handleSubmit}>
            <Box paddingY={6} paddingX={1} display={"flex"} flexDirection={"column"}
            width={{xs:300,md:400}} margin="auto" >
             { !isadmin && isSignup && <> <FormLabel sx={lableStyle}>Name</FormLabel>
             <TextField margin="normal" 
             value={inputs.name}
             onChange={handleChange}
             variant='standard' 
             type='text'
              name='name' /> </> }
             <FormLabel sx={lableStyle}>Email</FormLabel>
        
             <TextField margin="normal"
               value={inputs.email}
               onChange={handleChange} 
             variant='standard' 
             type='email'
              name='email' />
             <FormLabel sx={lableStyle}>password</FormLabel>
             <TextField margin="normal" variant="standard"
               value={inputs.password       } onChange={handleChange}
              type='password' name='password'/>
             <Button type={'submit'} sx={{mt:2, borderRadius:10, bgcolor:"#2b2d42"}} width={"80%"}>
                {isSignup ?  "Signup" : "Login"} 
             </Button>
            {!isadmin && <> <Button onClick={()=> setisSignup(!isSignup)}
             sx={{mt:2,borderRadius:20}} fullWidth>
               switch To {isSignup ? "Login" : "signup"}
             </Button>
             </>
}
        </Box>
        </form>
      </Dialog>
    </div>
  )
}

export default Authform
