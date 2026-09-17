import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Every route now lives under /api/v1 (e.g. /users -> /api/v1/users). Must run
  // before SwaggerModule.createDocument below, so the generated docs reflect it.
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  app.enableCors({
    origin: configService.get<string[]>('corsAllowedOrigins'),
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new PrismaExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('ECOS API')
    .setDescription('REST API for the ECOS health monitoring platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  app.use(
    '/api/docs',
    apiReference({
      spec: { content: documentFactory() },
    }),
  );

  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}
bootstrap().catch((err) => {
  console.error('Error starting server', err);
  process.exit(1);
});
