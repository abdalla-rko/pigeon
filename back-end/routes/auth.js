const router = require('express').Router();
const {OAuth2Client} = require('google-auth-library');
const {createJsonWebToken, refreshAndCheckToken} = require('../config/jwtToken')
const User = require('../models/User');

router.post('/logged', (req, res) => {
  console.log('****** loged');
  refreshAndCheckToken(req, res)
})

router.post('/google', (req, res) => {
  console.log('google ***********************');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: req.body.idtoken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userName = payload['name'];
    const userEmail = payload['email'];
    const picture = payload['picture'];

    const emailLowerCase = userEmail.toLowerCase()
    const emailExist = await User.findOne({email: emailLowerCase})
    if(emailExist) {
      return await createJsonWebToken(emailLowerCase, res)
    }

    const user = new User({
      username: userName,
      email: emailLowerCase,
      profile_pic: picture
    })
    try {
      await user.save()
      await createJsonWebToken(user.email, res)
    } catch (err) {
      console.log(err);
    }
  }
  verify().catch(console.error);
})

router.post('/facebook', async (req, res) => {
  console.log('run *******************************8');
  console.log('*****a', req.body);
  // todo verify token
  const { name, email, id } = req.body;

  const usernameSave = name.toLowerCase();
  const emailSave = email.toLowerCase();


  // todo: better error handeling
  const emailExist = await User.findOne({email: emailSave});
  if (emailExist) return await createJsonWebToken(emailSave, res)
  const usernameExist = await User.findOne({username: usernameSave})
  if (usernameExist) return await createJsonWebToken(emailSave, res)

  const user = new User({
    username: usernameSave,
    email: emailSave
  })
  try {
    await user.save()
    await createJsonWebToken(user.email, res)
  } catch (err) {
    console.error('error', error)
  }
  
})


router.post('/logout', async (req, res) => {
  console.log('done logout mab', req.headers.cookie);
  res.cookie('Authorization', {maxAge: Date.now()})
  return res.json({})
});

module.exports = router 