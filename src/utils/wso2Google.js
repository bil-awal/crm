/* eslint-disable camelcase */
export const wso2Google = () => {
  const env               = import.meta.env
  const domain            = `${env.VITE_IS}/${env.VITE_IS_AUTH_URI}`
  const client_id         = `client_id=${env.VITE_GOOGLE_CLIENT_ID}`
  const scope             = `scope=${env.VITE_IS_SCOPE}`
  const response_type     = `response_type=${env.VITE_IS_RESPONSE_TYPE}`
  const redirect_uri      = `redirect_uri=http://localhost:5173/callback/google`
  const code_challenge    = `code_challenge=${env.VITE_IS_CODE_CHALLENGE}`
  const challenge_method  = `code_challenge_method=${env.VITE_IS_CODE_CHALLENGE_METHOD}`

  const endpoint = `${domain}?${client_id}&${scope}&${response_type}&${redirect_uri}&${code_challenge}&${challenge_method}`

  window.location.href = endpoint
}
