import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../infrastructure/persistence/persistence.module';
import { SecurityModule } from '../../infrastructure/auth/security.module';
import { MUNICIPIO_REPOSITORY } from '../../domain/repositories/municipio.repository';
import { ListarMunicipios } from '../../application/use-cases/listar-municipios';
import { MunicipioController } from './municipio.controller';
import { LISTAR_MUNICIPIOS } from '../common/use-case.tokens';

@Module({
  imports: [PersistenceModule, SecurityModule],
  controllers: [MunicipioController],
  providers: [
    {
      provide: LISTAR_MUNICIPIOS,
      useFactory: (municipios) => new ListarMunicipios(municipios),
      inject: [MUNICIPIO_REPOSITORY],
    },
  ],
})
export class MunicipioModule {}
