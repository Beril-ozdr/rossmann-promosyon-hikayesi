# Hikâye metinleri (taslak, yazar: Beril Özdizdar)

## Açılış
**Başlık:** Rossmann'da promosyonlu günlerde satışlar yaklaşık %39 daha yüksek
**Alt başlık:** Bu hikâyede 1.115 Rossmann mağazasının yaklaşık 2,5 yıllık günlük satışlarına bakarak promosyonlu günlerin etkisini inceledim.

## Kaydırma adımları (sabit grafik)

**Adım 1 – promosyonsuz çubuk**
Promosyonsuz hafta içi günlerde ortalama satış (tüm mağazaların ve günlerin ortalaması) yaklaşık 5.900 €.

**Adım 2 – promosyonlu çubuk eklenir, "+%39"**
Promosyonlu günlerin ortalama satışı ise yaklaşık 8.200 €. Aradaki fark şu anlama geliyor: promosyonsuz günlerde 100 € satış yapılan bir mağaza, promosyonlu günlerde ortalama yaklaşık 139 € satış yapıyor.

**Adım 3 – müşteri sayısı ve müşteri başı harcama**
Yaptığımız hesaplamalar, mağaza başına günlük müşteri sayısının (bir mağazaya giren müşteri sayısı) promosyonlu günlerde yaklaşık %20 arttığını gösteriyor. Müşteri başına harcama da (bir müşterinin kasada bıraktığı ortalama tutar) promosyonlu günlerde yaklaşık %15 artıyor. Yani artış hem daha fazla müşteriden hem de müşteri başına daha yüksek harcamadan geliyor.

**Adım 4 – haftanın günleri, pazartesi vurgulanır**
Diğer günlere kıyasla, promosyonlu ve promosyonsuz günler arasındaki satış farkı en fazla pazartesi günü ortaya çıkıyor. Hesaplamalarımıza göre pazartesi günleri, promosyonlu günlerin ortalama satışı promosyonsuz pazartesilere göre yaklaşık %57 daha yüksek.

**Adım 5 – cuma vurgulanır**
Promosyonun etkisinin en düşük olduğu gün cuma: promosyonlu cuma günlerinde satışlar, promosyonsuz cumalara göre yaklaşık %22 daha yüksek. Pazartesi ile cuma arasında yaklaşık 35 yüzde puanlık fark var (yüzde puanı, iki yüzdenin birbirinden farkıdır: %57'ye karşı %22).

**Adım 6 – mağaza bazında nokta grafiği**
İncelediğimiz 1.115 mağazanın hiçbirinde satış düşüşü yaşanmadı, ama artış mağazadan mağazaya %2 ile %102 arasında değişiyor. Mağazaların yaklaşık yarısında satış artışı %31 ile %48 arasında.

**Adım 7 – mağaza tipine göre renkler, b tipi vurgulanır**
a, c ve d tiplerinde promosyonlu günlerde satış artışı birbirine yakın ve yaklaşık %38 ile %42 arasında. b tipinde ise artış belirgin biçimde daha düşük, yaklaşık %20. Ancak b tipinde yalnızca 17 mağaza bulunduğu için bu sonucu dikkatli yorumlamak gerekir.

## Bağlam
Perakende işletmeleri promosyon yapıyor, ancak bunun gerçekten işe yarayıp yaramadığını bilmek önemli. Bu hikâyede Kaggle'daki Rossmann Store Sales veri setini kullandım. Veri, 1.115 mağazanın 1 Ocak 2013 ile 31 Temmuz 2015 arasındaki günlük satışlarını içeriyor. Karşılaştırmayı pazartesi–cuma günleriyle yaptım. Önce promosyonlu günlerde satışların ne kadar arttığını, sonra bu artışın haftanın günlerine, mağazalara ve mağaza tiplerine göre değişip değişmediğini inceleyeceğim.

## Okuyucu keşfi yönergesi
Aşağıdan bir mağaza tipi seçerek o tipteki mağazalarda promosyonların satışları nasıl etkilediğini kendin görebilirsin.

## Sonuç
Sonuç olarak, promosyonlu günlerde satışlar yaklaşık %39 daha yüksek çıkıyor. Hiçbir mağazada satış düşmedi, ancak artışın büyüklüğü haftanın gününe, mağazaya ve mağaza tipine göre değişiyor.

Bu sonuçlara dikkatli yaklaşmak gerekiyor. Bu sonuçlar bir ilişkiyi gösteriyor, promosyonun tek başına nedeni olduğunu kanıtlamıyor; çünkü promosyonların hangi gün ve hangi mağazada yapılacağını şirket belirliyor. b tipinde yalnızca 17 mağaza bulunduğu için o tipin sonucu daha az güvenilir. Veri setinde mağaza tiplerinin (a, b, c, d) ne anlama geldiği de açıklanmıyor. Açık kalan sorular da var: bu veriyle pazartesi günü etkinin neden en yüksek olduğunu açıklayamıyoruz ve b tipinin neden farklı davrandığını bilmiyoruz. Promosyonların maliyeti veride olmadığı için de artan satışın kâra ne kadar yansıdığı belli değil.

## Yazar
Ben Beril Özdizdar, Manisa Celal Bayar Üniversitesi Büyük Veri Analistliği bölümünde öğrenciyim. Bu çalışmada bir veri setini anlamlı hâle getirmeyi ve hikâyeye dönüştürmeyi amaçladım.

## Not (son yazım kontrolünde)
- Zamir tutarlılığı: bazı yerlerde "ben" (kullandım, yaptım), bazı yerlerde "biz" (incelediğimiz, yaptığımız) var. Tek dile çevrilecek.
