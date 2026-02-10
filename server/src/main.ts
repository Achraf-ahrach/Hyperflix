import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ZodValidationPipe } from 'nestjs-zod';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global Zod validation pipe
  app.useGlobalPipes(new ZodValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Hyperflix API')
    .setDescription('API documentation for the Hyperflix application')
    .setVersion('1.0')
    .addTag('Hyperflix')
    .addBearerAuth() // If you want to test JWT-protected endpoints
    .addCookieAuth('Authentication') // For cookie-based auth
    .build();

  const document = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Enable cookie parser middleware
  app.use(cookieParser());

  // Enable CORS for Next.js frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // Allow cookies to be sent
  });

  await app.listen(process.env.BACKEND_PORT || 3001);
}
bootstrap();
