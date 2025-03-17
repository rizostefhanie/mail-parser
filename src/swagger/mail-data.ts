import { pathDownloadEmailExternal, pathDownloadEmailInternal } from 'src/mail/mail.model';

export const mailExamples ={
  url_with_json_link :{
    summary: 'Get json from link inside email content',
    value: 'https://storage.googleapis.com/mail_parse/Test_link_website.eml'
  },
  url_with_website_link :{
    summary: 'Scan website if contain a json link and return it and internal json link to get directly.',
    value: 'https://storage.googleapis.com/mail_parse/Test_link_website.eml'
  },
  path_local :{
    summary: 'Get json from internal file',
    value: pathDownloadEmailInternal+'/factura_electronica_peya.eml'
  }
}