import { Injectable } from '@nestjs/common';
import { SesEvent, SesReceiptDto } from 'src/aws/ses-event';
import { TransformSesEvent } from 'src/aws/transform-ses-event';


@Injectable()
export class SesService {

  spamVerdictVerified(spamVerdict: { status: string }): boolean {
    return spamVerdict.status === "PASS"
  }
  virusVerdictVerified(virusVerdict: { status: string }): boolean {
    return virusVerdict.status === "PASS"
  }
  dnsVerified(receipt: SesReceiptDto): boolean {
    return receipt.spfVerdict.status === "PASS"
      && receipt.dkimVerdict.status == "PASS"
      && receipt.dmarcVerdict.status =="PASS"
  }

  extractEmailUsername(email: string): string {
    // Check if the input is not empty and contains @ symbol
    if (!email || !email.includes('@')) {
      return email; // Return original string if it's not a valid email format
    }
    // Split the email at the @ symbol and return the first part
    return email.split('@')[0];
  }
  getDestinationNames(destination: string[]): string[]{
    return destination.map( d => this.extractEmailUsername(d))

  }
  getMonthName(isoDateString: string, language: 'en'  = 'en'): string {
    const date = new Date(isoDateString);
    const monthIndex = date.getMonth();

    const monthNames = {
      en: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
    };

    return monthNames[language][monthIndex];
  }
  processEvent(events: SesEvent): TransformSesEvent[] {
    // Process the mapped event
    return events.Records.flatMap((event) => {
     const transformSesEvent = new TransformSesEvent()
     transformSesEvent.spam = this.spamVerdictVerified(event.ses.receipt.spamVerdict)
     transformSesEvent.virus = this.virusVerdictVerified(event.ses.receipt.virusVerdict)
     transformSesEvent.dns = this.dnsVerified(event.ses.receipt)
     transformSesEvent.mes = this.getMonthName(event.ses.mail.timestamp)
     transformSesEvent.retrasado = event.ses.receipt.processingTimeMillis > 1000
     transformSesEvent.emisor = this.extractEmailUsername(event.ses.mail.source)
     transformSesEvent.receptor =  this.getDestinationNames(event.ses.mail.destination)
     return transformSesEvent
   })
  }

}