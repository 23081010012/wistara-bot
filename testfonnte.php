<?php
// test-fonnte.php

$token = "gxmbpys5Ysp8TNJeBaUo"; // token dari dashboard Fonnte kamu
$target = "62895381110035"; // nomor WA kamu (pastikan aktif di device Fonnte)

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://api.fonnte.com/send',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => array(
    'target' => $target,
    'message' => '✅ Tes kirim dari website Batik Wistara berhasil!',
  ),
  CURLOPT_HTTPHEADER => array(
    'Authorization: ' . $token
  ),
));

$response = curl_exec($curl);
if (curl_errno($curl)) {
  echo 'Error: ' . curl_error($curl);
}
curl_close($curl);

echo "<pre>";
print_r($response);
echo "</pre>";
