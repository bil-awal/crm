<template>
  <h2>Proprietary License Agreement</h2>

  <p>This software and accompanying documentation (the "Software") are proprietary products of Pancaran Group and are protected by copyright laws and international treaties. The Software is licensed, not sold, to you ("Licensee") for use strictly under the terms of this agreement.</p>

  <h3 class="section-title">
    1. License Grant
  </h3>
  <p>Pancaran Group grants Licensee a non-exclusive, non-transferable license to use the Software solely for Licensee’s internal business purposes. Licensee may install and use the Software on a single device, and the Software may only be used by a single user at any time.</p>

  <h3 class="section-title">
    2. Restrictions
  </h3>
  <p>Licensee shall not:</p>
  <ul>
    <li>Copy, modify, or distribute the Software or any part thereof, except as expressly permitted by this license.</li>
    <li>Reverse engineer, decompile, or disassemble the Software.</li>
    <li>Remove, alter, or obscure any proprietary notices, labels, or marks on the Software.</li>
    <li>Use the Software in a manner that violates any applicable law or regulation.</li>
  </ul>

  <h3 class="section-title">
    3. Ownership
  </h3>
  <p>The Software and all related intellectual property rights are the sole and exclusive property of Pancaran Group. Licensee acknowledges that no ownership rights are transferred to Licensee under this agreement. All rights not expressly granted to Licensee are reserved by Pancaran Group.</p>

  <h3 class="section-title">
    4. Termination
  </h3>
  <p>This license is effective until terminated. Pancaran Group may terminate this license at any time if Licensee breaches any term of this agreement. Upon termination, Licensee must immediately cease all use of the Software and destroy all copies of the Software in Licensee’s possession.</p>

  <h3 class="section-title">
    5. Disclaimer of Warranties
  </h3>
  <p>The Software is provided "AS IS," without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement. Pancaran Group does not warrant that the Software will meet Licensee's requirements or that the operation of the Software will be uninterrupted or error-free.</p>

  <h3 class="section-title">
    6. Limitation of Liability
  </h3>
  <p>Pancaran Group shall not be liable for any damages arising out of the use of or inability to use the Software due to user negligence. However, Pancaran Group shall be responsible for damages that occur due to technical errors within the Software, such as malfunction, bugs, data miscalculation, and similar issues.</p>

  <h3 class="section-title">
    7. Governing Law
  </h3>
  <p>This license shall be governed by and construed in accordance with the laws of the Republic of Indonesia, without regard to its conflict of law principles.</p>

  <h3 class="section-title">
    8. Entire Agreement
  </h3>
  <p>This agreement constitutes the entire understanding between the parties concerning the Software and supersedes all prior discussions, agreements, or understandings of any kind.</p>

  <h3 class="section-title">
    9. Contact Information
  </h3>
  <p>
    For inquiries regarding this license, please contact Pancaran Group at <a
      href="mailto:it.support@pancaran-group.co.id"
      target="_blank"
    >
      it.support@pancaran-group.co.id
    </a>
  </p>

  <div class="footer">
    <p @click="goBack">
      <span>
        &copy;
        {{ new Date().getFullYear() }}
        DEALS & All Rights Reserved by <a
          href="https://pancaran-group.co.id"
          target="_blank"
          rel="noopener noreferrer"
        >Pancaran Group</a>
      </span>
    </p>
  </div>
</template>


<script setup>
definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const router = useRouter()

const goBack = () => {
  router.go(-1)
}
</script>

<style>
body {
  padding: 20px;
  margin: 20px;
  background-color: #f4f4f4;
  color: #333;
  font-family: Arial, sans-serif;
  line-height: 1.6;
}

h2, h3 {
  color: #0056b3;
}

p {
  margin-block: 10px;
  margin-inline: 0;
}

.section-title {
  font-weight: bold;
  margin-block-start: 20px;
  text-decoration: underline;
}

.footer {
  color: #777;
  font-size: 0.9em;
  margin-block-start: 40px;
  text-align: center;
}
</style>
