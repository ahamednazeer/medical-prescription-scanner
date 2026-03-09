import {
    Controller, Post, Get, Put, Delete,
    Body, Param, UseGuards, Request,
    UseInterceptors, UploadedFile, ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
export class PrescriptionsController {
    constructor(private service: PrescriptionsService) { }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: diskStorage({
                destination: './uploads',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `prescription-${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                    cb(new Error('Only image files are allowed!'), false);
                }
                cb(null, true);
            },
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
        }),
    )
    async upload(@Request() req, @UploadedFile() file: Express.Multer.File) {
        const prescription = await this.service.upload(req.user.sub, file.path);
        return prescription;
    }

    @Post(':id/process')
    async process(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.service.process(id, req.user.sub);
    }

    @Get()
    async findAll(@Request() req) {
        return this.service.findAll(req.user.sub);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.service.findOne(id, req.user.sub);
    }

    @Put(':id/verify')
    async verify(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
        @Body() body: { medicines?: any[]; doctorName?: string; notes?: string },
    ) {
        return this.service.verify(id, req.user.sub, body);
    }

    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.service.remove(id, req.user.sub);
    }
}
