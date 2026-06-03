import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExchangeRatesService, CreateExchangeRateDto, UpdateExchangeRateDto } from './exchange-rates.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('ExchangeRates')
@ApiBearerAuth('access-token')
@Controller('exchange-rates')
export class ExchangeRatesController {
  constructor(private readonly service: ExchangeRatesService) {}

  @Get()
  @ApiOperation({ summary: 'List exchange rates' })
  findAll(
    @Query('fromCurrency') fromCurrency?: string,
    @Query('toCurrency') toCurrency?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.service.findAll({
      fromCurrency,
      toCurrency,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('currencies')
  @ApiOperation({ summary: 'Get supported currency list' })
  getSupportedCurrencies() {
    return this.service.getSupportedCurrencies();
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current rate for a currency pair on a date' })
  findCurrentRate(
    @Query('fromCurrency') fromCurrency: string,
    @Query('toCurrency') toCurrency: string,
    @Query('onDate') onDate?: string,
  ) {
    return this.service.findCurrentRate(fromCurrency, toCurrency, onDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one exchange rate' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create exchange rate' })
  create(@CurrentUser() user: any, @Body() dto: CreateExchangeRateDto) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update exchange rate' })
  update(@Param('id') id: string, @Body() dto: UpdateExchangeRateDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate exchange rate' })
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
