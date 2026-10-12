"""
Lightweight CNN used as the common baseline classifier for all
data-balancing / augmentation experiments (Group 11).

Architecture mirrors the reference paper's "Custom CNN" (two Basic
Blocks of 3x Conv(3x3,12) + BatchNorm + ELU + MaxPool, separated by an
extra pooling layer, followed by Flatten -> Dropout -> FC(10) ->
FC(1,sigmoid)), re-implemented in PyTorch and re-scaled for a 64x64
single-channel input (instead of the original 224x224x3) so that all
five benchmarks can be evaluated under many experimental conditions
within a CPU-only compute budget. 'same' padding is used on the conv
layers (the reference used 'valid' padding, which only works out
cleanly at 224x224) to keep the architecture well-defined at the
smaller resolution. The model stays in the same parameter-count
regime (~10^4 parameters) as the reference lightweight CNN.
"""
import torch
import torch.nn as nn


class BasicBlock(nn.Module):
    def __init__(self, in_ch, filters=12):
        super().__init__()
        self.conv1 = nn.Conv2d(in_ch, filters, 3, padding=1)
        self.conv2 = nn.Conv2d(filters, filters, 3, padding=1)
        self.conv3 = nn.Conv2d(filters, filters, 3, padding=1)
        self.act = nn.ELU()
        # NOTE: PyTorch's BatchNorm `momentum` is the weight given to the
        # *new* batch statistic (running = (1-m)*running + m*batch), the
        # opposite convention from Keras (where momentum is the weight kept
        # on the *old* running average). The reference paper's Keras
        # momentum=0.99 would translate to PyTorch momentum=0.01, but with
        # the small/undersampled training sets used by several balancing
        # strategies here that leaves running stats stuck near their
        # initial values (too few batches to adapt), causing a train/eval
        # mismatch. We use PyTorch's own default (0.1) instead, which
        # converges within a handful of batches regardless of strategy.
        self.bn = nn.BatchNorm2d(filters, momentum=0.1, eps=1e-3)
        self.pool = nn.MaxPool2d(2, 2)

    def forward(self, x):
        x = self.act(self.conv1(x))
        x = self.act(self.conv2(x))
        x = self.conv3(x)
        x = self.bn(x)
        x = self.act(x)
        x = self.pool(x)
        return x


class LightweightCNN(nn.Module):
    """Common baseline / proposed-method backbone (~8.6k params at 64x64x1)."""

    def __init__(self, in_ch=1, img_size=64, filters=12, fc_units=10):
        super().__init__()
        self.block1 = BasicBlock(in_ch, filters)
        mid_size = img_size // 2
        pool_mid_k = 4 if mid_size % 4 == 0 else 2
        self.mid_pool = nn.MaxPool2d(pool_mid_k, pool_mid_k)
        self.block2 = BasicBlock(filters, filters)
        self.dropout = nn.Dropout(0.3)

        with torch.no_grad():
            dummy = torch.zeros(1, in_ch, img_size, img_size)
            flat_dim = self._forward_features(dummy).shape[1]

        self.fc1 = nn.Linear(flat_dim, fc_units)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(fc_units, 1)

    def _forward_features(self, x):
        x = self.block1(x)
        x = self.mid_pool(x)
        x = self.block2(x)
        x = torch.flatten(x, 1)
        return x

    def forward(self, x):
        x = self._forward_features(x)
        x = self.dropout(x)
        x = self.relu(self.fc1(x))
        x = self.fc2(x)
        return x.squeeze(1)  # logits; apply sigmoid outside for probabilities


def count_params(model):
    return sum(p.numel() for p in model.parameters() if p.requires_grad)


if __name__ == "__main__":
    m = LightweightCNN()
    print(m)
    print("Trainable params:", count_params(m))
