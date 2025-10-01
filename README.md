<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).







import { MailerModule } from '@nestjs-modules/mailer';
import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

// Le module est Global pour être injecté partout sans devoir être importé à chaque fois
@Global() 
@Module({
  imports: [
    MailerModule.forRoot({
      // ⚠️ CONFIGURATION CLÉ : À ENREGISTRER DANS LES VARIABLES D'ENVIRONNEMENT (.env)
      transport: {
        host: 'smtp.ethereal.email', // Exemple pour les tests locaux (voir Nodemailer pour config)
        port: 587,
        secure: false, // true pour le port 465 (SSL/TLS)
        auth: {
          user: 'votre_user@example.com', // Remplacez par votre user/pass ou variable d'env
          pass: 'votre_motdepasse',
        },
      },
      defaults: {
        from: '"Resa Chap" <noreply@resachap.com>',
      },
      // Nous utiliserons le template Pug ou Handlebars si besoin, mais le service envoie du texte simple pour l'instant.
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
```eof

### C. Service de Mail

```typescript:Service Mail:src/mail/mail.service.ts
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { Reservation, Resource, User } from '@prisma/client';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  /**
   * Envoie une notification au Locateur lorsqu'une nouvelle demande arrive.
   * @param locateur Le propriétaire de la ressource.
   * @param locataire Le demandeur de la réservation.
   * @param reservation L'objet de la réservation.
   * @param resource L'objet de la ressource.
   */
  async sendReservationNotification(
    locateur: User,
    locataire: User,
    reservation: Reservation,
    resource: Resource,
  ) {
    // URL du dashboard du Locateur (à définir dans le frontend)
    const dashboardUrl = 'https://votresite.com/dashboard/reservations'; 

    const mailOptions = {
      to: locateur.email, // Email du Locateur
      subject: `Nouvelle demande de réservation pour ${resource.name}`,
      html: `
        <h1>Demande de Réservation Reçue !</h1>
        <p>Bonjour ${locateur.firstName || locateur.email},</p>
        <p>Vous avez reçu une nouvelle demande de réservation pour votre ressource : <b>${resource.name}</b>.</p>
        
        <h2>Détails de la demande :</h2>
        <ul>
          <li>**Ressource :** ${resource.name} (${resource.type})</li>
          <li>**Du :** ${reservation.dateDebut.toLocaleString()}</li>
          <li>**Au :** ${reservation.dateFin.toLocaleString()}</li>
          <li>**Demandeur :** ${locataire.email} (${locataire.firstName || 'Non renseigné'})</li>
          <li>**Notes :** ${reservation.notes || 'Aucune'}</li>
        </ul>
        
        <p>Veuillez vous connecter à votre tableau de bord pour accepter ou annuler la demande :</p>
        <a href="${dashboardUrl}">Gérer les Réservations</a>
        
        <p>Cordialement, <br/>L'équipe Resa Chap</p>
      `,
    };

    // ⚠️ Décommenter pour l'envoi réel
    /* await this.mailerService.sendMail(mailOptions);
    */
    console.log(`[MAIL MOCK] Notification envoyée à ${locateur.email}`);
  }
}
```eof

### Prochaine Étape : Intégration dans le Module `Reservation`

Nous avons maintenant un modèle `User` complet, un nouveau statut `CONFIRMED`, et un service d'envoi d'emails.

La prochaine étape sera d'intégrer ce `MailService` dans le **`ReservationService`** et de mettre à jour la logique de création (`createReservation`) pour :
1.  Vérifier la disponibilité.
2.  Créer la réservation.
3.  **Envoyer la notification par email au Locateur.**

Êtes-vous prêt pour cette mise à jour de la logique de réservation ?