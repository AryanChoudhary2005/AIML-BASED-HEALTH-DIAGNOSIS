import torch
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import os

# 1. Hardware Safety Limits for 8GB VRAM
IMG_SIZE = 512
BATCH_SIZE = 8

# 2. Set up the Image Transformation (The "Perfect Brick" maker)
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.Grayscale(num_output_channels=1), # X-rays only need 1 color channel
    transforms.ToTensor() # Converts pixels into PyTorch math tensors
])  

# 3. Tell PyTorch where your extracted Kaggle folder is
# ⚠️ UPDATE THIS LINE to your actual folder path! ⚠️
base_dir = r"D:\ameeti2-20240921T044205Z-001\ameeti2\major project\Health-AI-Project\backend\chest_xray" 

train_dir = os.path.join(base_dir, 'train')
test_dir = os.path.join(base_dir, 'test')

print("Scanning folders and applying 512x512 transformations...")

# 4. Read the folders
train_data = datasets.ImageFolder(root=train_dir, transform=transform)
test_data = datasets.ImageFolder(root=test_dir, transform=transform)

# 5. Create the Batch Feeders
train_loader = DataLoader(train_data, batch_size=BATCH_SIZE, shuffle=True)
test_loader = DataLoader(test_data, batch_size=BATCH_SIZE, shuffle=False)

print("\n--- PIPELINE READY ---")
print(f"Found {len(train_data)} training X-rays.")
print(f"Found {len(test_data)} testing X-rays.")
print(f"Classes detected: {train_data.classes}")
print(f"Batch size locked at {BATCH_SIZE} to protect VRAM.")

import torch.nn as nn
import torch.nn.functional as F

print("\nBuilding the High-Res Digital Eye...")

class PneumoniaCNN(nn.Module):
    def __init__(self):
        super(PneumoniaCNN, self).__init__()
        # Input is 1 channel (grayscale)
        
        # 1. The Magnifying Glasses (Convolutional Layers) & Shrinkers (Max Pooling)
        self.conv1 = nn.Conv2d(in_channels=1, out_channels=32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(in_channels=32, out_channels=64, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(in_channels=64, out_channels=128, kernel_size=3, padding=1)
        self.conv4 = nn.Conv2d(in_channels=128, out_channels=128, kernel_size=3, padding=1)
        self.conv5 = nn.Conv2d(in_channels=128, out_channels=128, kernel_size=3, padding=1)
        
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)

        # 2. The Final Decision Maker (Fully Connected Layers)
        # After 5 pools, the 512x512 image is shrunk to 16x16. 
        # 128 channels * 16 width * 16 height = 32,768 flat connections
        self.fc1 = nn.Linear(128 * 16 * 16, 128)
        self.fc2 = nn.Linear(128, 1) # 1 final output: Normal or Pneumonia

    def forward(self, x):
        # Pass the image through the glasses and shrink it
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        x = self.pool(F.relu(self.conv4(x)))
        x = self.pool(F.relu(self.conv5(x)))
        
        # Flatten the 3D brick into a 1D list
        x = torch.flatten(x, 1) 
        
        # Pass through the decision maker
        x = F.relu(self.fc1(x))
        x = self.fc2(x) 
        return x

# 3. Create the brain and MOVE IT TO THE GPU!
model = PneumoniaCNN()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device) # This physically sends the math to your RTX 2060 Super

print(f"Digital Eye successfully built and moved to: {device}")

import torch.optim as optim

# 1. The Referee (Loss Function) and The Coach (Optimizer)
# BCEWithLogitsLoss is perfect for Yes/No (Binary) classification
criterion = nn.BCEWithLogitsLoss() 
optimizer = optim.Adam(model.parameters(), lr=0.001)

EPOCHS = 3 # We will do 3 passes over the dataset for this first test

print(f"\n🚀 STARTING THE TRAINING ENGINE (Target: {EPOCHS} Epochs)...")
print(f"Total batches per epoch: {len(train_loader)}")
print("Listen for your GPU fans spinning up! This will take a few minutes...\n")

for epoch in range(EPOCHS):
    model.train() # Put the brain in "learning mode"
    running_loss = 0.0
    correct_predictions = 0
    total_samples = 0
    
    for batch_idx, (images, labels) in enumerate(train_loader):
        # Move the batch of 8 images and their answers to the RTX 2060 Super
        images = images.to(device)
        labels = labels.float().unsqueeze(1).to(device) 
        
        # Step 1: Clear the old math
        optimizer.zero_grad()
        
        # Step 2: Make a guess
        outputs = model(images)
        
        # Step 3: Check how wrong the guess was
        loss = criterion(outputs, labels)
        
        # Step 4: Calculate the corrections (Backpropagation)
        loss.backward()
        
        # Step 5: Apply the corrections
        optimizer.step()
        
        # --- Tracking our Progress ---
        running_loss += loss.item()
        
        # Convert raw math into a 1 (Pneumonia) or 0 (Normal) guess
        predictions = torch.sigmoid(outputs) >= 0.5
        correct_predictions += (predictions == labels).sum().item()
        total_samples += labels.size(0)
        
        # Print an update every 100 batches so we know it's working
        if (batch_idx + 1) % 100 == 0:
            print(f"Epoch [{epoch+1}/{EPOCHS}] | Batch [{batch_idx+1}/{len(train_loader)}] | Loss: {loss.item():.4f}")
    
    # Calculate the final grade for the Epoch
    epoch_accuracy = (correct_predictions / total_samples) * 100
    print(f"✅ Epoch {epoch+1} Completed! Average Loss: {running_loss/len(train_loader):.4f} | Accuracy: {epoch_accuracy:.2f}%\n")

print("🎉 TRAINING COMPLETE! Your digital eye has officially learned to see.")

# Save the brain to a file so we can use it on your website later!
torch.save(model.state_dict(), "pneumonia_model_512.pth")
print("Model saved successfully as 'pneumonia_model_512.pth'")