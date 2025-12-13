const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const targetPath = './src/environments/environment.ts';

const envConfigFile = `
export const environment = {
  production: false,
  GGMAPI: '${process.env.GGMAPI}', 
};
`;

fs.writeFile(targetPath, envConfigFile, function (err) {
  if (err) console.log(err);
  else console.log('✅ เขียนไฟล์ environment.ts เรียบร้อยแล้ว!');
});