# okulum.cloud bilgi sistemi - PWA

Angular uygulamanızda PWA desteği aktif edildi.

- Offline mod ve ana ekrana ekle özellikleri hazır.
- `manifest.webmanifest` ve `ngsw-config.json` dosyaları otomatik oluşturuldu.
- Service Worker ile offline veri ve önbellekleme desteği var.

## Test
Uygulamayı üretim modunda derleyip (`ng build --prod`) bir sunucuda çalıştırarak PWA özelliklerini test edebilirsiniz.

## Sonraki Adımlar
- Push notification eklemek için ek PWA yapılandırması yapılabilir.
- Dashboard ve CRUD ekranları ile offline işlem ekleme/senkronizasyon geliştirilebilir.
